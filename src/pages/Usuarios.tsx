import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, UserPlus, Shield, Eye, Settings, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: string | null;
  created_at: string;
}

const Usuarios = () => {
  const { profile, tenantId, requireRole } = useTenant();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'viewer' | 'manager' | 'admin'>('viewer');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = requireRole(['admin']);
  const canManage = requireRole(['admin', 'manager']);

  // Fetch users for current tenant
  const fetchUsers = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers((data || []).map(user => ({
        ...user,
        role: user.role as 'admin' | 'manager' | 'viewer'
      })));
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem alterar papéis de usuários.",
        variant: "destructive"
      });
      return;
    }

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .eq('tenant_id', tenantId);

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ));

      toast({
        title: "Papel atualizado",
        description: "O papel do usuário foi alterado com sucesso."
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro ao atualizar papel",
        description: "Não foi possível alterar o papel do usuário.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  // Add user to tenant (if they already exist in auth)
  const addUserToTenant = async () => {
    if (!newUserEmail || !tenantId || !isAdmin) return;

    try {
      // Check if user exists in profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newUserEmail)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        if (existingUser.tenant_id === tenantId) {
          toast({
            title: "Usuário já existe",
            description: "Este usuário já faz parte desta empresa.",
            variant: "destructive"
          });
          return;
        }

        if (existingUser.tenant_id) {
          toast({
            title: "Usuário em outra empresa",
            description: "Este usuário já está associado a outra empresa.",
            variant: "destructive"
          });
          return;
        }

        // Update existing user to join this tenant
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            tenant_id: tenantId,
            role: newUserRole 
          })
          .eq('id', existingUser.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Usuário adicionado",
          description: "O usuário foi adicionado à empresa com sucesso."
        });
      } else {
        toast({
          title: "Usuário não encontrado",
          description: "O usuário precisa se cadastrar na plataforma primeiro. Convide-o através do Supabase Auth Dashboard.",
          variant: "destructive"
        });
        return;
      }

      setNewUserEmail('');
      setNewUserRole('viewer');
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: "Não foi possível adicionar o usuário à empresa.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'viewer': return 'Leitor';
      default: return role;
    }
  };

  return (
    <AuthGuard requireRoles={['admin', 'manager']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-8 h-8 text-brand-primary" />
              Usuários
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários e permissões da empresa
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-primary hover:bg-brand-primary-dark gap-2">
                  <UserPlus className="w-4 h-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Usuário à Empresa</DialogTitle>
                  <DialogDescription>
                    Adicione um usuário existente à sua empresa. O usuário deve já ter se cadastrado na plataforma.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email do Usuário</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Papel</Label>
                    <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Leitor</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Nota:</strong> Se o usuário não existir, convide-o primeiro através do 
                      <a 
                        href="https://supabase.com/dashboard/project/qmrnsznbixnlavtjhcpi/auth/users" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:underline ml-1"
                      >
                        Supabase Auth Dashboard
                      </a>.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addUserToTenant} disabled={!newUserEmail}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Users Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Usuários da Empresa</CardTitle>
            <CardDescription>
              {canManage ? 'Gerencie os usuários e suas permissões' : 'Visualize os usuários da empresa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary mr-2" />
                <span className="text-muted-foreground">Carregando usuários...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    {isAdmin && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-brand-primary">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || 'Nome não informado'}
                            </p>
                            {user.id === profile?.id && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || 'Email não informado'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {user.id === profile?.id ? (
                            <span className="text-xs text-muted-foreground">Você</span>
                          ) : (
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                              disabled={updating === user.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Leitor</SelectItem>
                                <SelectItem value="manager">Gerente</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Permissions Info */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-primary" />
              Níveis de Permissão
            </CardTitle>
            <CardDescription>
              Entenda os diferentes níveis de acesso no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">Leitor</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pode visualizar dashboards, relatórios e dados. Não pode editar ou excluir.
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Gerente</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pode criar, editar e visualizar dados. Acesso às configurações básicas.
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acesso completo ao sistema, incluindo gerenciamento de usuários e configurações avançadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default Usuarios;