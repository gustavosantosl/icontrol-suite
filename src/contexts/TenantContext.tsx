import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Fetch user profile from Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setProfileMissing(true);
        setProfile(null);
        setTenant(null);
        return;
      }

      setProfile({
        ...profileData,
        role: profileData.role as 'admin' | 'manager' | 'viewer'
      });
      setProfileMissing(false);

      // Fetch tenant info if profile has tenant_id
      if (profileData.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .single();

        if (tenantError) {
          console.error('Tenant fetch error:', tenantError);
          setTenant(null);
        } else {
          setTenant(tenantData);
        }
      } else {
        setTenant(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileMissing(true);
      setProfile(null);
      setTenant(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setTenant(null);
          setProfileMissing(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
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

  // Refetch profile manually
  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value: TenantContextType = {
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
  };

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