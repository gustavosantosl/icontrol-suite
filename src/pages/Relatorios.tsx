import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  TrendingUp,
  Filter
} from "lucide-react";

const Relatorios = () => {
  const reports = [
    {
      id: 1,
      name: "Relatório Mensal",
      description: "Resumo completo das movimentações do mês",
      type: "Financeiro",
      lastGenerated: "15/03/2024",
      status: "Atualizado",
      icon: BarChart3,
    },
    {
      id: 2,
      name: "Fluxo de Caixa",
      description: "Análise detalhada de entradas e saídas",
      type: "Fluxo",
      lastGenerated: "14/03/2024", 
      status: "Atualizado",
      icon: TrendingUp,
    },
    {
      id: 3,
      name: "Categorias de Despesas",
      description: "Distribuição por categorias de gastos",
      type: "Análise",
      lastGenerated: "12/03/2024",
      status: "Pendente",
      icon: PieChart,
    },
    {
      id: 4,
      name: "Relatório Anual",
      description: "Balanço completo do exercício fiscal",
      type: "Anual",
      lastGenerated: "01/01/2024",
      status: "Atualizado",
      icon: FileText,
    },
  ];

  const quickStats = [
    {
      title: "Relatórios Gerados",
      value: "47",
      period: "Este mês",
      change: "+23%",
    },
    {
      title: "Downloads",
      value: "156",
      period: "Total",
      change: "+8%",
    },
    {
      title: "Tipos Ativos",
      value: "8",
      period: "Configurados",
      change: "=",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Atualizado":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Erro":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e relatórios financeiros detalhados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md gap-2">
            <Calendar className="w-4 h-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{stat.period}</span>
                  <span className={`font-medium ${
                    stat.change.startsWith('+') 
                      ? 'text-green-600' 
                      : stat.change === '='
                      ? 'text-muted-foreground'
                      : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
          <CardDescription>
            Gerencie e baixe seus relatórios financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <report.icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{report.name}</h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Tipo: {report.type}</span>
                      <span>Último: {report.lastGenerated}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    Visualizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    disabled={report.status === "Pendente"}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-subtle rounded-lg">
              <p className="text-muted-foreground">Gráfico de barras comparativo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Gastos por categoria este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-subtle rounded-lg">
              <p className="text-muted-foreground">Gráfico de pizza</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;