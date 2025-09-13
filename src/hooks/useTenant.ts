import { useContext } from 'react';
import { TenantContext } from '../contexts/TenantContext.tsx'; // Importe o contexto

// Mova os dois hooks para este arquivo
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export function useRequireRole(allowedRoles: string[]) {
  const { requireRole, role, loading } = useTenant();
  
  if (loading) return { hasAccess: false, loading: true };
  
  const hasAccess = requireRole(allowedRoles);
  
  if (!hasAccess && !loading) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${role || 'none'}`);
  }
  
  return { hasAccess, loading: false };
}