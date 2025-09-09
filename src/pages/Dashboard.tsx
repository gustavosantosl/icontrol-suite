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

const Dashboard = () => {
  const { profile, requireRole } = useTenant();
  const [mostrarModal, setMostrarModal] = React.useState(false);
  const [atualizarLista, setAtualizarLista] = React.useState(0);

  // Check if user has access to financial data
  const canViewFinancialData = requireRole(['admin', 'manager', 'viewer']);

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
            Visão geral do controle financeiro - {profile?.full_name || profile?.email}
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