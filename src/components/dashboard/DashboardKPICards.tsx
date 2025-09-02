import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle,
  DollarSign 
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface KPIData {
  monthlyIncome: number;
  monthlyExpenses: number;
  currentBalance: number;
  overdueAccounts: number;
}

export function DashboardKPICards() {
  const { profile } = useTenant();
  const [kpiData, setKpiData] = useState<KPIData>({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    currentBalance: 0,
    overdueAccounts: 0
  });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    const fetchKPIData = async () => {
      if (!profile?.tenant_id) return;

      try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Get monthly transactions
        const { data: monthlyTransactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('tenant_id', profile.tenant_id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        // Get all transactions for balance
        const { data: allTransactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('tenant_id', profile.tenant_id);

        // Get overdue installments
        const { data: overdueInstallments } = await supabase
          .from('installments')
          .select('id')
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString().split('T')[0]);

        // Calculate KPIs
        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        monthlyTransactions?.forEach(transaction => {
          if (transaction.type === 'RECEITA') {
            monthlyIncome += Number(transaction.amount);
          } else if (transaction.type === 'DESPESA') {
            monthlyExpenses += Number(transaction.amount);
          }
        });

        let currentBalance = 0;
        allTransactions?.forEach(transaction => {
          if (transaction.type === 'RECEITA') {
            currentBalance += Number(transaction.amount);
          } else if (transaction.type === 'DESPESA') {
            currentBalance -= Number(transaction.amount);
          }
        });

        setKpiData({
          monthlyIncome,
          monthlyExpenses,
          currentBalance,
          overdueAccounts: overdueInstallments?.length || 0
        });
      } catch (error) {
        console.error('Erro ao carregar dados do KPI:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-kpi-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${profile?.tenant_id}`
        },
        () => {
          fetchKPIData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: `tenant_id=eq.${profile?.tenant_id}`
        },
        () => {
          fetchKPIData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id]);

  const kpiCards = [
    {
      title: "Receitas do Mês",
      value: formatCurrency(kpiData.monthlyIncome),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: TrendingUp,
      bgGradient: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    },
    {
      title: "Despesas do Mês", 
      value: formatCurrency(kpiData.monthlyExpenses),
      change: "-5.2%",
      changeType: "negative" as const,
      icon: TrendingDown,
      bgGradient: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      title: "Saldo Atual",
      value: formatCurrency(kpiData.currentBalance),
      change: kpiData.currentBalance >= 0 ? "Positivo" : "Negativo",
      changeType: kpiData.currentBalance >= 0 ? "positive" : "negative" as const,
      icon: Wallet,
      bgGradient: kpiData.currentBalance >= 0 
        ? "bg-gradient-to-br from-blue-500 to-blue-600"
        : "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      title: "Contas em Atraso",
      value: kpiData.overdueAccounts.toString(),
      change: "Atenção necessária",
      changeType: "warning" as const,
      icon: AlertTriangle,
      bgGradient: "bg-gradient-to-br from-amber-500 to-amber-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className={`${card.bgGradient} p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <card.icon className="w-5 h-5 opacity-90" />
                  <h3 className="font-medium text-sm opacity-90">
                    {card.title}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              <div className="text-2xl font-bold">
                {card.value}
              </div>
              <p className={`text-xs opacity-80 flex items-center gap-1`}>
                {card.changeType === "positive" && <TrendingUp className="w-3 h-3" />}
                {card.changeType === "negative" && <TrendingDown className="w-3 h-3" />}
                {card.changeType === "warning" && <AlertTriangle className="w-3 h-3" />}
                {card.change}
              </p>
            </div>
          </div>
          
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
        </Card>
      ))}
    </div>
  );
}