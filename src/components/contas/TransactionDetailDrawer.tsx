import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Trash2, CreditCard, Calendar, DollarSign, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface Transaction {
  id: string;
  type: 'pagar' | 'receber';
  description: string;
  amount: number;
  num_installments?: number;
  first_due_date?: string;
  payment_method?: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  parties?: {
    name: string;
  };
}

interface Installment {
  id: string;
  installment_number: number;
  value: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  emission_date: string;
}

interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onTransactionDeleted: () => void;
  onInstallmentUpdated: () => void;
}

export const TransactionDetailDrawer = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onTransactionDeleted,
  onInstallmentUpdated 
}: TransactionDetailDrawerProps) => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch installments
  const fetchInstallments = async () => {
    if (!transaction || !tenantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('transaction_id', transaction.id)
        .eq('tenant_id', tenantId)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      
      const mappedInstallments: Installment[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'paid' | 'overdue'
      }));
      
      setInstallments(mappedInstallments);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar parcelas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && transaction) {
      fetchInstallments();
    }
  }, [isOpen, transaction, tenantId]);

  // Real-time subscription for installments
  useEffect(() => {
    if (!tenantId || !transaction) return;

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
  }, [tenantId, transaction]);

  // Mark installment as paid
  const handleMarkAsPaid = async (installmentId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase.rpc('mark_installment_paid', {
        p_installment_id: installmentId,
        p_tenant_id: tenantId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Parcela marcada como paga",
      });
      
      fetchInstallments();
      onInstallmentUpdated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao marcar parcela como paga",
        variant: "destructive"
      });
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async () => {
    if (!transaction || !tenantId) return;
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
      
      onTransactionDeleted();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive"
      });
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      default:
        return status;
    }
  };

  if (!transaction) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalhes da Transação
          </SheetTitle>
          <SheetDescription>
            Visualize e gerencie os detalhes da transação e suas parcelas
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Gerais</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-medium">{transaction.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={transaction.type === 'pagar' ? 'destructive' : 'default'}>
                  {transaction.type === 'pagar' ? 'Conta a Pagar' : 'Conta a Receber'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusLabel(transaction.status)}
                  </Badge>
                </div>
              </div>

              {transaction.parties?.name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.type === 'pagar' ? 'Fornecedor' : 'Cliente'}
                    </p>
                    <p className="font-medium">{transaction.parties.name}</p>
                  </div>
                </div>
              )}

              {transaction.payment_method && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium">{transaction.payment_method}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data de Criação</p>
                  <p className="font-medium">
                    {format(new Date(transaction.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Installments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parcelas</h3>
              <Badge variant="outline">
                {installments.length} parcela{installments.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-4">Carregando parcelas...</div>
            ) : installments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma parcela encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {installment.installment_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(installment.due_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(installment.value)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(installment.status)}>
                          {getStatusLabel(installment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {installment.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(installment.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ações</h3>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteTransaction}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Transação
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};