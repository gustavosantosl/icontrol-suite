import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

// Import our new report components
import { CashFlowChart } from "@/components/relatorios/CashFlowChart";
import { ExpenseCategoryChart } from "@/components/relatorios/ExpenseCategoryChart";
import { AgingChart } from "@/components/relatorios/AgingChart";
import { SummaryCards } from "@/components/relatorios/SummaryCards";
import { DateRangeFilter } from "@/components/relatorios/DateRangeFilter";
import { ExportButtons } from "@/components/relatorios/ExportButtons";
import { InstallmentCharts } from "@/components/installments/InstallmentCharts";

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  status: 'pendente' | 'pago' | 'vencido';
  description: string;
  due_date: string | null;
  created_at: string;
  party_id: string | null;
  tenant_id: string;
}

const Relatorios = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 2)), // Last 3 months
    to: endOfMonth(new Date())
  });

  // Fetch transactions from Supabase
  const fetchTransactions = async (showRefreshToast = false) => {
    // Don't fetch if no tenant
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(showRefreshToast);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId) // Filter by tenant
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Type cast the data to match our interface
      const typedTransactions = (data || []).map(t => ({
        ...t,
        type: t.type as 'RECEITA' | 'DESPESA', 
        status: t.status as 'pendente' | 'pago' | 'vencido'
      }));
      setTransactions(typedTransactions);
      
      if (showRefreshToast) {
        toast({
          title: "Dados Atualizados",
          description: "Relatórios atualizados com sucesso!"
        });
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar as transações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount and date range changes
  useEffect(() => {
    if (tenantId) {
      fetchTransactions();
    }
  }, [dateRange, tenantId]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange, tenantId]);

  const handleRefresh = () => {
    fetchTransactions(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-muted-foreground">Carregando relatórios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análises completas e insights do seu desempenho financeiro
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportButtons transactions={transactions} dateRange={dateRange} />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Período</CardTitle>
          <CardDescription>
            Selecione o período para análise dos relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </CardContent>
      </Card>

      {/* Main Report Tabs */}
      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          <TabsTrigger value="vencimentos">Vencimentos</TabsTrigger>
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="resumo" className="space-y-6">
          <SummaryCards transactions={transactions} dateRange={dateRange} />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CashFlowChart transactions={transactions} dateRange={dateRange} />
            <ExpenseCategoryChart transactions={transactions} />
          </div>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="fluxo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCards transactions={transactions} dateRange={dateRange} />
          </div>
          <CashFlowChart transactions={transactions} dateRange={dateRange} />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ExpenseCategoryChart transactions={transactions} />
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Detalhamento por Categoria</CardTitle>
                <CardDescription>
                  Valores detalhados das principais categorias de despesas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* This would be a detailed breakdown table */}
                  <div className="text-center text-muted-foreground py-8">
                    <p>Tabela detalhada de categorias</p>
                    <p className="text-sm">(Implementação futura)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aging Tab */}
        <TabsContent value="vencimentos" className="space-y-6">
          <AgingChart transactions={transactions} />
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Contas em Atraso</CardTitle>
              <CardDescription>
                Lista detalhada das contas vencidas que precisam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions
                  .filter(t => t.status === 'vencido')
                  .slice(0, 10)
                  .map(transaction => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type} • Vencido
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(Number(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  ))
                }
                {transactions.filter(t => t.status === 'vencido').length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>✅ Nenhuma conta em atraso!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installments Tab */}
        <TabsContent value="parcelas" className="space-y-6">
          <InstallmentCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;