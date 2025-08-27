import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Plus,
  Calendar,
  Clock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // Dashboard cards data
  const dashboardCards = [
    {
      title: "Saldo Geral",
      description: "Receitas - Despesas",
      value: "R$ 32.997,33",
      trend: "+12.5% este mês",
      trendType: "positive" as const,
      icon: Wallet,
      bgColor: "bg-brand-primary",
      textColor: "text-white",
    },
    {
      title: "Contas a Pagar",
      description: "15 contas",
      value: "R$ 8.450,00",
      trend: "Vencimento médio: 12 dias",
      trendType: "neutral" as const,
      icon: ArrowDown,
      bgColor: "bg-red-500",
      textColor: "text-white",
    },
    {
      title: "Contas a Receber",
      description: "28 contas",
      value: "R$ 18.320,50",
      trend: "Vencimento médio: 8 dias",
      trendType: "positive" as const,
      icon: ArrowUp,
      bgColor: "bg-green-500",
      textColor: "text-white",
    },
    {
      title: "Alertas",
      description: "Atenção necessária",
      value: "7",
      trend: "3 contas vencidas",
      trendType: "warning" as const,
      icon: AlertTriangle,
      bgColor: "bg-brand-accent",
      textColor: "text-brand-primary",
    },
  ];

  // Cash flow chart data
  const cashFlowData = [
    { 
      periodo: 'Jan', 
      entradas: 45000, 
      saidas: 28000,
      saldo: 17000 
    },
    { 
      periodo: 'Fev', 
      entradas: 52000, 
      saidas: 31000,
      saldo: 21000 
    },
    { 
      periodo: 'Mar', 
      entradas: 48000, 
      saidas: 29000,
      saldo: 19000 
    },
    { 
      periodo: 'Abr', 
      entradas: 61000, 
      saidas: 35000,
      saldo: 26000 
    },
    { 
      periodo: 'Mai', 
      entradas: 55000, 
      saidas: 33000,
      saldo: 22000 
    },
    { 
      periodo: 'Jun', 
      entradas: 67000, 
      saidas: 38000,
      saldo: 29000 
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

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <div className={`${card.bgColor} p-6`}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <card.icon className={`w-6 h-6 ${card.textColor}`} />
                    <h3 className={`font-semibold ${card.textColor}`}>
                      {card.title}
                    </h3>
                  </div>
                  <p className={`text-sm ${card.textColor} opacity-90`}>
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className={`text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </div>
                <p className={`text-sm ${card.textColor} opacity-80`}>
                  {card.trend}
                </p>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          </Card>
        ))}
      </div>

      {/* Cash Flow Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-brand-primary">Fluxo de Caixa</CardTitle>
              <CardDescription>
                Análise de entradas e saídas dos últimos 6 meses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                Período
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cashFlowData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="periodo" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    name === 'entradas' ? 'Entradas (Receitas)' : 
                    name === 'saidas' ? 'Saídas (Despesas)' : 'Saldo'
                  ]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => 
                    value === 'entradas' ? 'Entradas (Receitas)' : 
                    value === 'saidas' ? 'Saídas (Despesas)' : 'Saldo Líquido'
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saidas" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#FBBF24" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#FBBF24', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>
                  Últimas movimentações financeiras
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  desc: "Pagamento recebido - Cliente Premium Ltda", 
                  value: "+R$ 5.500,00", 
                  time: "2h atrás",
                  type: "income",
                  category: "Receita"
                },
                { 
                  desc: "Pagamento fornecedor - Material de escritório", 
                  value: "-R$ 850,00", 
                  time: "4h atrás",
                  type: "expense",
                  category: "Despesa"
                },
                { 
                  desc: "Recebimento PIX - Cliente ABC Corp", 
                  value: "+R$ 3.200,00", 
                  time: "1d atrás",
                  type: "income",
                  category: "Receita"
                },
                { 
                  desc: "Pagamento aluguel - Escritório sede", 
                  value: "-R$ 2.800,00", 
                  time: "2d atrás",
                  type: "expense",
                  category: "Despesa"
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{activity.desc}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {activity.category}
                        </Badge>
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
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

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Tarefas frequentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3 bg-brand-primary hover:bg-brand-primary-dark text-white">
              <Plus className="w-4 h-4" />
              Nova Receita
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <ArrowDown className="w-4 h-4" />
              Nova Despesa
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <Calendar className="w-4 h-4" />
              Agendar Pagamento
            </Button>
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meta mensal:</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-brand-accent h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  R$ 37.500 de R$ 50.000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;