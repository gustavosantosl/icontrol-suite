import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface SummaryData {
  totalPagar: number;
  totalReceber: number;
  contasVencidas: number;
  saldoAtual: number;
}

export const ContasSummaryCards = () => {
  const { tenantId } = useTenant();
  const [summary, setSummary] = useState<SummaryData>({
    totalPagar: 0,
    totalReceber: 0,
    contasVencidas: 0,
    saldoAtual: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);

      // Fetch transactions summary
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('type, amount, status, due_date')
        .eq('tenant_id', tenantId);

      if (transError) throw transError;

      // Fetch installments summary  
      const { data: installments, error: instError } = await supabase
        .from('installments')
        .select('value, status, due_date')
        .eq('tenant_id', tenantId);

      if (instError) throw instError;

      // Calculate summaries
      const today = new Date().toISOString().split('T')[0];
      
      let totalPagar = 0;
      let totalReceber = 0;
      let contasVencidas = 0;

      // Calculate from transactions (for single payments)
      transactions?.forEach(transaction => {
        if (transaction.status !== 'paid') {
          if (transaction.type === 'pagar') {
            totalPagar += transaction.amount;
          } else {
            totalReceber += transaction.amount;
          }

          // Check if overdue
          if (transaction.due_date && transaction.due_date < today && transaction.status === 'pending') {
            contasVencidas++;
          }
        }
      });

      // Calculate from installments (for installment payments)
      installments?.forEach(installment => {
        if (installment.status !== 'paid') {
          // Note: We would need to join with transactions to get type, for now skip this calculation
        }

        // Check if overdue
        if (installment.due_date < today && installment.status === 'pending') {
          contasVencidas++;
        }
      });

      const saldoAtual = totalReceber - totalPagar;

      setSummary({
        totalPagar,
        totalReceber,
        contasVencidas,
        saldoAtual
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [tenantId]);

  // Real-time updates
  useEffect(() => {
    if (!tenantId) return;

    const channels = [
      supabase
        .channel('transactions-summary')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenantId}`
        }, () => fetchSummary())
        .subscribe(),
      
      supabase
        .channel('installments-summary')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: `tenant_id=eq.${tenantId}`
        }, () => fetchSummary())
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [tenantId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total a Pagar */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
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
            {formatCurrency(summary.totalPagar)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Obrigações pendentes
          </p>
        </CardContent>
      </Card>

      {/* Total a Receber */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
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
            {formatCurrency(summary.totalReceber)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valores em aberto
          </p>
        </CardContent>
      </Card>

      {/* Saldo Atual */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${summary.saldoAtual >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Projetado
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.saldoAtual)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Receber - Pagar
          </p>
        </CardContent>
      </Card>

      {/* Contas Vencidas */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Vencidas
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {summary.contasVencidas}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requer atenção imediata
          </p>
        </CardContent>
      </Card>
    </div>
  );
};