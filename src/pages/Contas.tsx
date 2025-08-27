import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter,
  CreditCard,
  Wallet,
  Building2,
  TrendingUp,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  ArrowDown,
  ArrowUp,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types
interface Account {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  tipo: 'pagar' | 'receber';
}

interface AccountFormData {
  descricao: string;
  valor: string;
  dataVencimento: Date | undefined;
  status: 'Pendente' | 'Pago' | 'Atrasado';
}

const Contas = () => {
  const { toast } = useToast();
  
  // Mock data for demonstration
  const [contasPagar, setContasPagar] = useState<Account[]>([
    {
      id: '1',
      descricao: 'Aluguel do escritório',
      valor: 2800.00,
      dataVencimento: new Date('2024-03-15'),
      status: 'Pendente',
      tipo: 'pagar'
    },
    {
      id: '2', 
      descricao: 'Fornecedor de material',
      valor: 1250.50,
      dataVencimento: new Date('2024-03-10'),
      status: 'Atrasado',
      tipo: 'pagar'
    },
    {
      id: '3',
      descricao: 'Energia elétrica',
      valor: 450.75,
      dataVencimento: new Date('2024-03-20'),
      status: 'Pago',
      tipo: 'pagar'
    },
  ]);

  const [contasReceber, setContasReceber] = useState<Account[]>([
    {
      id: '4',
      descricao: 'Serviços prestados - Cliente A',
      valor: 5500.00,
      dataVencimento: new Date('2024-03-12'),
      status: 'Pago',
      tipo: 'receber'
    },
    {
      id: '5',
      descricao: 'Consultoria - Cliente B', 
      valor: 3200.00,
      dataVencimento: new Date('2024-03-18'),
      status: 'Pendente',
      tipo: 'receber'
    },
    {
      id: '6',
      descricao: 'Projeto desenvolvimento',
      valor: 8900.00,
      dataVencimento: new Date('2024-03-08'),
      status: 'Atrasado',
      tipo: 'receber'
    },
  ]);

  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'pagar' | 'receber'>('pagar');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  const [formData, setFormData] = useState<AccountFormData>({
    descricao: '',
    valor: '',
    dataVencimento: undefined,
    status: 'Pendente'
  });

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isOverdue = (date: Date, status: string) => {
    return status !== 'Pago' && date < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Atrasado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // CRUD operations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.dataVencimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      descricao: formData.descricao,
      valor: parseFloat(formData.valor.replace(/[^\d,.-]/g, '').replace(',', '.')),
      dataVencimento: formData.dataVencimento,
      status: formData.status,
      tipo: currentTab
    };

    if (editingAccount) {
      // Update existing account
      if (currentTab === 'pagar') {
        setContasPagar(prev => prev.map(conta => 
          conta.id === editingAccount.id ? { ...newAccount, id: editingAccount.id } : conta
        ));
      } else {
        setContasReceber(prev => prev.map(conta => 
          conta.id === editingAccount.id ? { ...newAccount, id: editingAccount.id } : conta
        ));
      }
      
      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso!",
      });
    } else {
      // Add new account
      if (currentTab === 'pagar') {
        setContasPagar(prev => [...prev, newAccount]);
      } else {
        setContasReceber(prev => [...prev, newAccount]);
      }
      
      toast({
        title: "Sucesso", 
        description: "Conta adicionada com sucesso!",
      });
    }

    // Reset form
    setFormData({
      descricao: '',
      valor: '',
      dataVencimento: undefined,
      status: 'Pendente'
    });
    setEditingAccount(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      descricao: account.descricao,
      valor: account.valor.toString(),
      dataVencimento: account.dataVencimento,
      status: account.status
    });
    setCurrentTab(account.tipo);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string, tipo: 'pagar' | 'receber') => {
    if (tipo === 'pagar') {
      setContasPagar(prev => prev.filter(conta => conta.id !== id));
    } else {
      setContasReceber(prev => prev.filter(conta => conta.id !== id));
    }
    
    toast({
      title: "Sucesso",
      description: "Conta removida com sucesso!",
    });
  };

  // Calculate summaries
  const totalPagar = contasPagar.reduce((sum, conta) => 
    sum + (conta.status !== 'Pago' ? conta.valor : 0), 0
  );
  
  const totalReceber = contasReceber.reduce((sum, conta) => 
    sum + (conta.status !== 'Pago' ? conta.valor : 0), 0
  );

  const contasVencidas = [
    ...contasPagar.filter(conta => isOverdue(conta.dataVencimento, conta.status)),
    ...contasReceber.filter(conta => isOverdue(conta.dataVencimento, conta.status))
  ].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie contas a pagar e a receber
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md"
              onClick={() => {
                setEditingAccount(null);
                setFormData({
                  descricao: '',
                  valor: '',
                  dataVencimento: undefined,
                  status: 'Pendente'
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </DialogTitle>
              <DialogDescription>
                {editingAccount ? 'Atualize as informações da conta' : 'Adicione uma nova conta a pagar ou a receber'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Conta</Label>
                <Select 
                  value={currentTab} 
                  onValueChange={(value: 'pagar' | 'receber') => setCurrentTab(value)}
                  disabled={!!editingAccount}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="pagar">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-4 h-4 text-red-500" />
                        Conta a Pagar
                      </div>
                    </SelectItem>
                    <SelectItem value="receber">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-green-500" />
                        Conta a Receber
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Descrição da conta"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  placeholder="R$ 0,00"
                  value={formData.valor}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formattedValue = (parseInt(value) / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    });
                    setFormData(prev => ({ ...prev, valor: value ? formattedValue : '' }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dataVencimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dataVencimento ? (
                        format(formData.dataVencimento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dataVencimento}
                      onSelect={(date) => setFormData(prev => ({ ...prev, dataVencimento: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'Pendente' | 'Pago' | 'Atrasado') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white"
                >
                  {editingAccount ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-red-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total a Pagar
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPagar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasPagar.filter(c => c.status !== 'Pago').length} contas pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-green-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total a Receber
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceber)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasReceber.filter(c => c.status !== 'Pago').length} contas pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-accent" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contas Vencidas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-accent">
              {contasVencidas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Pagar/Receber */}
      <Tabs defaultValue="pagar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pagar" className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4" />
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="receber" className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4" />
            Contas a Receber
          </TabsTrigger>
        </TabsList>

        {/* Contas a Pagar */}
        <TabsContent value="pagar" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-brand-primary">Contas a Pagar</CardTitle>
                  <CardDescription>
                    Gerencie suas despesas e compromissos financeiros
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Buscar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasPagar.map((conta) => (
                      <TableRow 
                        key={conta.id}
                        className={cn(
                          isOverdue(conta.dataVencimento, conta.status) 
                            ? "bg-red-50 border-l-4 border-l-red-500" 
                            : ""
                        )}
                      >
                        <TableCell className="font-medium">
                          {conta.descricao}
                          {isOverdue(conta.dataVencimento, conta.status) && (
                            <Badge variant="outline" className="ml-2 text-red-600 border-red-600">
                              Vencida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {formatCurrency(conta.valor)}
                        </TableCell>
                        <TableCell>
                          {format(conta.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(conta.status)}>
                            {conta.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(conta)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(conta.id, 'pagar')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contas a Receber */}
        <TabsContent value="receber" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-brand-primary">Contas a Receber</CardTitle>
                  <CardDescription>
                    Acompanhe suas receitas e recebimentos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Buscar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasReceber.map((conta) => (
                      <TableRow 
                        key={conta.id}
                        className={cn(
                          isOverdue(conta.dataVencimento, conta.status) 
                            ? "bg-red-50 border-l-4 border-l-red-500" 
                            : ""
                        )}
                      >
                        <TableCell className="font-medium">
                          {conta.descricao}
                          {isOverdue(conta.dataVencimento, conta.status) && (
                            <Badge variant="outline" className="ml-2 text-red-600 border-red-600">
                              Vencida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(conta.valor)}
                        </TableCell>
                        <TableCell>
                          {format(conta.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(conta.status)}>
                            {conta.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(conta)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(conta.id, 'receber')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Contas;