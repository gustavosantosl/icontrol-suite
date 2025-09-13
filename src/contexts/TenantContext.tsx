import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  // -------------------------
  // AUTH LISTENERS
  // -------------------------
  useEffect(() => {
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // -------------------------
  // FETCH PROFILE + TENANT
  // -------------------------
  const refetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setTenant(null);
      setProfileMissing(false);
      return;
    }

    try {
      setLoading(true);
      // Buscar perfil
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profiles) {
        setProfileMissing(true);
        setProfile(null);
        setTenant(null);
        return;
      }

      setProfile(profiles as UserProfile);
      setProfileMissing(false);

      if (profiles.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profiles.tenant_id)
          .maybeSingle();

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
  };

  useEffect(() => {
    if (user) {
      refetchProfile();
    } else {
      setProfile(null);
      setTenant(null);
      setLoading(false);
    }
  }, [user]);

  // -------------------------
  // AUTH FUNCTIONS
  // -------------------------
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, session: data.session };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const user = data.user;
    if (user) {
      // Criar o perfil automaticamente
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        tenant_id: null,
        role: 'viewer',
      });

      if (profileError) {
        console.error('Erro ao criar perfil do usuário:', profileError.message);
        throw profileError;
      }
    }

    return { user: data.user, session: data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTenant(null);
  };

  const requireRole = (roles: string[]) => {
    if (!profile?.role) return false;
    return roles.includes(profile.role);
  };

  // -------------------------
  // MEMOIZED VALUE
  // -------------------------
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

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
