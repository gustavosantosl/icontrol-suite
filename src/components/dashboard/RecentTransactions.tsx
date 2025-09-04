import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight, ArrowDownRight, Eye } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "pagar" | "receber";
  status: string;
  created_at: string;
}

export function RecentTransactions() {
  const { profile } = useTenant();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pago':
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pendente':
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'vencido':
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pago':
      case 'paid':
        return 'Pago';
      case 'pendente':
      case 'pending':
        return 'Pendente';
      case 'vencido':
      case 'overdue':
        return 'Vencido';
      default:
        return status || 'N/A';
    }
  };

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!profile?.tenant_id) return;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setTransactions(
          (data || []).map(transaction => ({
            ...transaction,
            type: transaction.type as "pagar" | "receber"
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar transações recentes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('recent-transactions-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${profile?.tenant_id}`
        },
        () => {
          fetchRecentTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id]);

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>Últimas movimentações financeiras</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações financeiras
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/contas')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma transação encontrada</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/contas')}
            >
              Adicionar primeira transação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate('/contas')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'receber' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {transaction.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(transaction.status)}`}
                      >
                        {getStatusLabel(transaction.status)}
                      </Badge>
                      <Clock className="w-3 h-3" />
                      {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${
                    transaction.type === 'receber' 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'receber' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </div>
                  {transaction.type === 'receber' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}