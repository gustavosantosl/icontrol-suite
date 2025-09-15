// src/pages/Dashboard.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { DashboardKPICards } from "@/components/dashboard/DashboardKPICards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { DashboardExport } from "@/components/dashboard/DashboardExport";
import { NovaTransacao } from "@/components/dashboard/NovaTransacao";
import { ResumoFinanceiro } from "@/components/dashboard/ResumoFinanceiro";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
} from "recharts";

const COLORS = {
  entrada: "#16a34a", // green
  saida: "#ef4444",   // red
  neutral: "#E5E7EB", // gray
};

const Dashboard: React.FC = () => {
  const { profile, requireRole } = useTenant();
  const [mostrarModal, setMostrarModal] = React.useState(false);
  const [atualizarLista, setAtualizarLista] = React.useState(0);

  // Check if user has access to financial data
  const canViewFinancialData = requireRole(['admin', 'manager', 'viewer', 'user']);

  // Função para atualizar lista após inserção
  const aoSucessoTransacao = () => {
    setMostrarModal(false);
    setAtualizarLista(prev => prev + 1);
  };

  // Real-time updates para transações
  React.useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('transacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        () => setAtualizarLista(prev => prev + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id]);

  if (!canViewFinancialData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar dados financeiros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do controle financeiro - {profile?.name || profile?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardExport />
          <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
            <DialogTrigger asChild>
              <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Transação</DialogTitle>
              </DialogHeader>
              <NovaTransacao aoSucesso={aoSucessoTransacao} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKPICards />

      {/* --- NOVO: Faturamento Mensal (círculo + totais) */}
      <FaturamentoMensal key={atualizarLista} tenantId={profile?.tenant_id || null} />

      {/* Charts Section */}
      <DashboardCharts />

      {/* Recent Transactions */}
      <RecentTransactions key={atualizarLista} />

      {/* Resumo Financeiro */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Resumo Financeiro</h2>
        <ResumoFinanceiro atualizarDados={atualizarLista} />
      </div>
    </div>
  );
};

export default Dashboard;

/* ============================
   Componente local: FaturamentoMensal
   - mostra total de vendas (entradas) do mês
   - mostra total gasto (saídas) do mês
   - donut (metade verde/metade vermelho de acordo com proporção)
   ============================ */
type FaturamentoMensalProps = {
  tenantId: string | null;
};

const FaturamentoMensal: React.FC<FaturamentoMensalProps> = ({ tenantId }) => {
  const [carregando, setCarregando] = React.useState(false);
  const [entradaTotal, setEntradaTotal] = React.useState<number>(0);
  const [saidaTotal, setSaidaTotal] = React.useState<number>(0);

  const buscarTotais = React.useCallback(async () => {
    if (!tenantId) {
      setEntradaTotal(0);
      setSaidaTotal(0);
      return;
    }

    setCarregando(true);
    try {
      const inicio = startOfMonth(new Date());
      const fim = endOfMonth(new Date());

      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, type, created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString());

      if (error) throw error;

      let entradas = 0;
      let saidas = 0;

      (data || []).forEach((t: any) => {
        const valor = Number(t.amount || 0);
        const tipo = (t.type || '').toString().toLowerCase();
        if (tipo === 'receber' || tipo === 'entrada') {
          entradas += valor;
        } else if (tipo === 'pagar' || tipo === 'saida' || tipo === 'saída') {
          saidas += valor;
        }
      });

      setEntradaTotal(Number(entradas.toFixed(2)));
      setSaidaTotal(Number(saidas.toFixed(2)));
    } catch (err) {
      console.error(err);
      setEntradaTotal(0);
      setSaidaTotal(0);
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    buscarTotais();
  }, [buscarTotais]);

  const total = entradaTotal + saidaTotal;
  const data = total > 0
    ? [
        { name: 'Entradas', value: entradaTotal, color: COLORS.entrada },
        { name: 'Saídas', value: saidaTotal, color: COLORS.saida },
      ]
    : [
        { name: 'Entradas', value: 1, color: COLORS.neutral },
        { name: 'Saídas', value: 1, color: COLORS.neutral },
      ];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const net = entradaTotal - saidaTotal;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Donut com label central corrigido */}
      <div className="p-4 rounded-2xl bg-white shadow-sm flex items-center justify-center relative">
        <div style={{ width: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartTooltip
                formatter={(value: any, name: string) => [
                  formatCurrency(Number(value)),
                  name
                ]}
              />
              <Pie
                data={data}
                innerRadius={70}
                outerRadius={95}
                padAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Label central FIXO */}
        <div className="absolute text-center">
          <div className="text-sm text-muted-foreground">Saldo Líquido</div>
          <div className={`text-lg font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(net)}
          </div>
          <div className="text-xs text-muted-foreground">Mensal</div>
        </div>
      </div>

      {/* Totais - Entradas */}
      <div className="p-4 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Total de Vendas (mês)</div>
          <div className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(entradaTotal)}</div>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          {carregando ? "Carregando..." : "Valores calculados para o mês atual"}
        </div>
      </div>

      {/* Totais - Saídas */}
      <div className="p-4 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Total Gasto (mês)</div>
          <div className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(saidaTotal)}</div>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          {carregando ? "Carregando..." : "Valores calculados para o mês atual"}
        </div>
      </div>
    </div>
  );
};
