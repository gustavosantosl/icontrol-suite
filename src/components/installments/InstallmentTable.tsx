import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarIcon,
  Download
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  emission_date: string;
  value: number;
  status: 'pending' | 'paid' | 'overdue';
  transaction_id: string;
  tenant_id: string;
  created_at: string;
}

interface Transaction {
  id: string;
  description: string;
  type: string;
}

interface InstallmentWithTransaction extends Installment {
  transaction?: Transaction;
}

export function InstallmentTable() {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [installments, setInstallments] = useState<InstallmentWithTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusInfo = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return {
        label: 'Pago',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      };
    }
    
    if (status === 'pending' && isBefore(due, today)) {
      return {
        label: 'Atrasado',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle
      };
    }
    
    return {
      label: 'Pendente',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    };
  };

  const fetchInstallments = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('installments')
        .select(`
          *,
          transaction:transactions(id, description, type)
        `)
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: true });

      if (error) throw error;

        // Update overdue status
        const today = new Date();
        const updatedInstallments = data?.map(installment => {
          const dueDate = new Date(installment.due_date);
          let status = installment.status as 'pending' | 'paid' | 'overdue';
          
          if (status === 'pending' && isBefore(dueDate, today)) {
            status = 'overdue';
          }
          
          return { ...installment, status };
        }) || [];

      setInstallments(updatedInstallments);
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar parcelas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('installments')
        .update({ status: 'paid' })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Parcela marcada como paga!'
      });

      await fetchInstallments();
    } catch (error) {
      console.error('Error updating installment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar parcela',
        variant: 'destructive'
      });
    }
  };

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = !searchTerm || 
      installment.transaction?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installment.installment_number.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || installment.status === statusFilter;
    
    const matchesDateRange = (!dateRange.from || isAfter(new Date(installment.due_date), dateRange.from)) &&
      (!dateRange.to || isBefore(new Date(installment.due_date), dateRange.to));
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  useEffect(() => {
    fetchInstallments();
  }, [tenantId]);

  // Set up real-time updates
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('installments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          fetchInstallments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const summary = {
    total: installments.length,
    pending: installments.filter(i => i.status === 'pending').length,
    paid: installments.filter(i => i.status === 'paid').length,
    overdue: installments.filter(i => i.status === 'overdue').length,
    totalValue: installments.reduce((sum, i) => sum + i.value, 0),
    pendingValue: installments.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.value, 0)
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-blue-600">{summary.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagas</p>
                <p className="text-xl font-bold text-green-600">{summary.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-xl font-bold text-red-600">{summary.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Pendente</p>
              <p className="text-lg font-bold text-brand-primary">{formatCurrency(summary.pendingValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-primary">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Descrição ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-primary">Parcelas</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredInstallments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma parcela encontrada
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments.map((installment) => {
                    const statusInfo = getStatusInfo(installment.status, installment.due_date);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">
                          {installment.installment_number}
                        </TableCell>
                        <TableCell>
                          {installment.transaction?.description || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(installment.value)}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("border", statusInfo.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {installment.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(installment.id)}
                              className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Marcar como Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}