import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ArrowUpRight,
  Plus
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Receita Total",
      value: "R$ 45.231,89",
      change: "+20.1%",
      trend: "up" as const,
      icon: TrendingUp,
    },
    {
      title: "Despesas",
      value: "R$ 12.234,56", 
      change: "-4.3%",
      trend: "down" as const,
      icon: TrendingDown,
    },
    {
      title: "Saldo Atual",
      value: "R$ 32.997,33",
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Clientes Ativos",
      value: "2.350",
      change: "+8.2%",
      trend: "up" as const,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu controle financeiro
          </p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${
                  stat.trend === 'up' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className={`flex items-center text-sm ${
                  stat.trend === 'up' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  <ArrowUpRight className={`w-4 h-4 mr-1 ${
                    stat.trend === 'down' ? 'rotate-90' : ''
                  }`} />
                  {stat.change} este mês
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>
              Entradas e saídas dos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-subtle rounded-lg">
              <p className="text-muted-foreground">Gráfico de fluxo de caixa</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas transações registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { desc: "Pagamento recebido - Cliente A", value: "+R$ 2.500,00", time: "2h atrás" },
                { desc: "Despesa - Material de escritório", value: "-R$ 350,00", time: "4h atrás" },
                { desc: "Pagamento recebido - Cliente B", value: "+R$ 1.800,00", time: "1d atrás" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{activity.desc}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <div className={`font-semibold ${
                    activity.value.startsWith('+') 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {activity.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;