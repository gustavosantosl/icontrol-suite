import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRoles?: string[];
}

export function AuthGuard({ children, requireRoles }: AuthGuardProps) {
  const navigate = useNavigate();
  const { session, profile, loading, signOut } = useTenant();

  useEffect(() => {
    // If loading is false and either no session or no profile, redirect to login
    if (!loading && (!session || !profile)) {
      navigate('/login');
    }
  }, [session, profile, loading, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-muted-foreground">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (session or profile missing)
  if (!session || !profile) {
    return null;
  }

  // Show profile error warning (this should rarely happen now)
  if (!profile.tenant_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertDescription>
              <div className="space-y-4">
                <p className="font-medium">Perfil incompleto</p>
                <p className="text-sm">
                  Seu perfil não está associado a nenhuma empresa.
                  Entre em contato com o administrador do sistema para configurar seu acesso.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Tentar Novamente
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={signOut}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requireRoles && requireRoles.length > 0) {
    const hasRequiredRole = requireRoles.includes(profile.role);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertDescription>
                <div className="space-y-4">
                  <p className="font-medium">Acesso Negado</p>
                  <p className="text-sm">
                    Você não tem permissão para acessar esta área.
                    Roles necessárias: {requireRoles.join(', ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seu nível de acesso: {profile.role}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/')}
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}