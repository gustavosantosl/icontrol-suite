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
  totalToPay: number;
  totalToReceive: number;
  paidAmount: number;
  receivedAmount: number;
  overdueAmount: number;
}

export function DashboardKPICards() {
  const { profile } = useTenant();
  const [kpiData, setKpiData] = useState<KPIData>({
    totalToPay: 0,
    totalToReceive: 0,
    paidAmount: 0,
    receivedAmount: 0,
    overdueAmount: 0
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
        // Get all transactions
        const { data: allTransactions } = await supabase
          .from('transactions')
          .select('amount, type, status, due_date')
          .eq('tenant_id', profile.tenant_id);

        // Get all installments
        const { data: allInstallments } = await supabase
          .from('installments')
          .select('value, status, due_date')
          .eq('tenant_id', profile.tenant_id);

        const today = new Date().toISOString().split('T')[0];

        // Calculate KPIs
        let totalToPay = 0;
        let totalToReceive = 0;
        let paidAmount = 0;
        let receivedAmount = 0;
        let overdueAmount = 0;

        // Process transactions
        allTransactions?.forEach(transaction => {
          const amount = Number(transaction.amount);
          
          if (transaction.type === 'pagar') {
            if (transaction.status === 'paid') {
              paidAmount += amount;
            } else {
              totalToPay += amount;
              if (transaction.due_date && transaction.due_date < today) {
                overdueAmount += amount;
              }
            }
          } else if (transaction.type === 'receber') {
            if (transaction.status === 'received') {
              receivedAmount += amount;
            } else {
              totalToReceive += amount;
              if (transaction.due_date && transaction.due_date < today) {
                overdueAmount += amount;
              }
            }
          }
        });

        // Process overdue installments for more accurate overdue calculation
        allInstallments?.forEach(installment => {
          if (installment.status === 'pending' && installment.due_date < today) {
            overdueAmount += Number(installment.value);
          }
        });

        setKpiData({
          totalToPay,
          totalToReceive,
          paidAmount,
          receivedAmount,
          overdueAmount
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
      title: "Total a Pagar",
      value: formatCurrency(kpiData.totalToPay),
      change: `${((kpiData.totalToPay / (kpiData.totalToPay + kpiData.paidAmount)) * 100).toFixed(1)}% pendente`,
      changeType: "warning" as const,
      icon: TrendingDown,
      bgGradient: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      title: "Total a Receber", 
      value: formatCurrency(kpiData.totalToReceive),
      change: `${((kpiData.totalToReceive / (kpiData.totalToReceive + kpiData.receivedAmount)) * 100).toFixed(1)}% pendente`,
      changeType: "positive" as const,
      icon: TrendingUp,
      bgGradient: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    },
    {
      title: "Valor Pago",
      value: formatCurrency(kpiData.paidAmount),
      change: "Concluído",
      changeType: "positive" as const,
      icon: DollarSign,
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Contas Vencidas",
      value: formatCurrency(kpiData.overdueAmount),
      change: "Atenção necessária",
      changeType: "negative" as const,
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