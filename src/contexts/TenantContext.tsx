import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: string | null;
  created_at: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  created_at: string;
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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  requireRole: (allowedRoles: string[]) => boolean;
  refetchProfile: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  // Buscar perfil e tenant do usuário no Supabase
  const buscarPerfilETenantt = async (userId: string) => {
    console.log('Iniciando busca de perfil e tenant...');
    
    // Create a timeout promise to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
    });

    try {
      setLoading(true);
      
      console.log('Buscando perfil para o userId:', userId);
      
      // Add timeout to profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: dadosPerfil, error: erroPerfil } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      console.log('dadosPerfil:', dadosPerfil, 'erroPerfil:', erroPerfil);

      if (erroPerfil) {
        console.error('Erro ao buscar perfil:', erroPerfil);
        setProfileMissing(true);
        setProfile(null);
        setTenant(null);
        return;
      }

      const perfilCompleto: UserProfile = {
        ...dadosPerfil,
        role: dadosPerfil.role as 'admin' | 'manager' | 'viewer'
      };
      
      setProfile(perfilCompleto);
      setProfileMissing(false);

      // Buscar informações do tenant se o perfil possui tenant_id
      if (dadosPerfil.tenant_id) {
        console.log('Buscando tenant...');
        
        // Add timeout to tenant fetch
        const tenantPromise = supabase
          .from('tenants')
          .select('*')
          .eq('id', dadosPerfil.tenant_id)
          .single();

        const { data: dadosTenant, error: erroTenant } = await Promise.race([
          tenantPromise,
          timeoutPromise
        ]) as any;

        console.log('dadosTenant:', dadosTenant, 'erroTenant:', erroTenant);

        if (erroTenant) {
          console.error('Erro ao buscar tenant:', erroTenant);
          setTenant(null);
        } else {
          setTenant(dadosTenant);
        }
      } else {
        setTenant(null);
      }
    } catch (error) {
      console.error('Erro geral ao buscar dados do usuário:', error);
      setProfileMissing(true);
      setProfile(null);
      setTenant(null);
    } finally {
      console.log('Busca finalizada.');
      setLoading(false);
    }
  };

  // Inicializar estado de autenticação
  useEffect(() => {
    // Configurar listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sessao) => {
        setSession(sessao);
        setUser(sessao?.user ?? null);
        
        if (sessao?.user) {
          // Buscar perfil imediatamente após autenticação
          await buscarPerfilETenantt(sessao.user.id);
        } else {
          setProfile(null);
          setTenant(null);
          setProfileMissing(false);
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session: sessaoExistente } }) => {
      setSession(sessaoExistente);
      setUser(sessaoExistente?.user ?? null);
      
      if (sessaoExistente?.user) {
        buscarPerfilETenantt(sessaoExistente.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email
          }
        }
      });
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTenant(null);
    setProfileMissing(false);
  };

  // Role checking helper
  const requireRole = (allowedRoles: string[]): boolean => {
    if (!profile || !profile.role) return false;
    return allowedRoles.includes(profile.role);
  };

  // Recarregar perfil manualmente
  const refetchProfile = async () => {
    if (user) {
      await buscarPerfilETenantt(user.id);
    }
  };

  const value: TenantContextType = useMemo(() => ({
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
    refetchProfile,
  }), [user, session, profile, tenant, loading, profileMissing]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// Custom hook to use tenant context
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Custom hook for role checking with redirect/error
export function useRequireRole(allowedRoles: string[]) {
  const { requireRole, role, loading } = useTenant();
  
  if (loading) return { hasAccess: false, loading: true };
  
  const hasAccess = requireRole(allowedRoles);
  
  if (!hasAccess && !loading) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${role || 'none'}`);
  }
  
  return { hasAccess, loading: false };
}