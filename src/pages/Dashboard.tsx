import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DashboardKPICards } from "@/components/dashboard/DashboardKPICards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { DashboardExport } from "@/components/dashboard/DashboardExport";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { profile, requireRole } = useTenant();
  const navigate = useNavigate();

  // Check if user has access to financial data
  const canViewFinancialData = requireRole(['admin', 'manager', 'viewer']);

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
          <Button 
            className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md"
            onClick={() => navigate('/contas')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKPICards />

      {/* Charts Section */}
      <DashboardCharts />

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
};

export default Dashboard;