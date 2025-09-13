import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// --- TIPOS E INTERFACES ---
export interface UserProfile {
  id: string;
  email: string;
  tenant_id: string | null;
  role: string;
}

export interface TenantInfo {
  id: string;
  name: string;
}

interface TenantContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  tenant: TenantInfo | null;
  tenantId: string | null;
  role: string | null;
  loading: boolean;
  profileMissing: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; }>;
  signOut: () => Promise<void>;
  requireRole: (roles: string[]) => boolean;
  refetchProfile: () => Promise<void>;
}

// --- CRIAÇÃO DO CONTEXTO ---
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// --- COMPONENTE PROVIDER ---
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  
  const user = session?.user ?? null;

  // Função estabilizada com useCallback para buscar dados do usuário
  const fetchProfileAndTenant = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setTenant(null);
      setProfileMissing(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') { // Erro específico para "nenhuma linha encontrada"
          console.warn('Perfil não encontrado para o usuário:', user.id);
          setProfileMissing(true);
          setProfile(null);
          setTenant(null);
        } else {
          throw profileError;
        }
        return; // Retorna após tratar o erro de perfil
      }
      
      setProfile(profileData as UserProfile);
      setProfileMissing(false);

      if (profileData?.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .single();

        if (tenantError) throw tenantError;
        setTenant(tenantData as TenantInfo);
      } else {
        setTenant(null);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil/tenant:', err);
      setProfile(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Depende apenas do ID do usuário, que é estável

  // Efeito para escutar a autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Efeito para buscar dados quando o usuário muda
  useEffect(() => {
    fetchProfileAndTenant();
  }, [user?.id, fetchProfileAndTenant]);


  // Funções de autenticação estabilizadas com useCallback
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, session: data.session };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    // A criação de perfil é melhor tratada por um DB Trigger no Supabase
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { user: data.user, session: data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const requireRole = useCallback((roles: string[]) => {
    if (!profile?.role) return false;
    return roles.includes(profile.role);
  }, [profile]);
  
  // Valor do contexto memorizado, agora com funções estáveis
  const value = useMemo(() => ({
    user,
    session,
    profile,
    tenant,
    tenantId: profile?.tenant_id || null,
    role: profile?.role || null,
    loading,
    profileMissing,
    signIn,
    signUp,
    signOut,
    requireRole,
    refetchProfile: fetchProfileAndTenant,
  }), [
    user,
    session,
    profile,
    tenant,
    loading,
    profileMissing,
    signIn,
    signUp,
    signOut,
    requireRole,
    fetchProfileAndTenant
  ]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// Hook para usar o contexto
export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}