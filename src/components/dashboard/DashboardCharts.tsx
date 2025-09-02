import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useTenant } from "@/contexts/TenantContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartData {
  cashFlow: Array<{
    date: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }>;
  expensesByCategory: Array<{
    name: string;
    value: number;
  }>;
  overdueAccounts: Array<{
    period: string;
    count: number;
  }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export function DashboardCharts() {
  const { profile } = useTenant();
  const [chartData, setChartData] = useState<ChartData>({
    cashFlow: [],
    expensesByCategory: [],
    overdueAccounts: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    const fetchChartData = async () => {
      if (!profile?.tenant_id) return;

      try {
        // Get transactions for the selected period
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
          .order('created_at', { ascending: true });

        // Get installments data
        const { data: installments } = await supabase
          .from('installments')
          .select('*')
          .eq('tenant_id', profile.tenant_id);

        // Process cash flow data
        const days = eachDayOfInterval({
          start: dateRange.from,
          end: dateRange.to
        });

        const cashFlowData = days.map(day => {
          const dayTransactions = transactions?.filter(t => 
            format(new Date(t.created_at!), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          ) || [];

          const receitas = dayTransactions
            .filter(t => t.type === 'RECEITA')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const despesas = dayTransactions
            .filter(t => t.type === 'DESPESA')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          return {
            date: format(day, 'dd/MM', { locale: ptBR }),
            receitas,
            despesas,
            saldo: receitas - despesas
          };
        });

        // Process expenses by category data
        const expenseTransactions = transactions?.filter(t => t.type === 'DESPESA') || [];
        const categoryMap = new Map<string, number>();
        
        expenseTransactions.forEach(transaction => {
          const category = transaction.description?.split(' - ')[0] || 'Outros';
          categoryMap.set(category, (categoryMap.get(category) || 0) + Number(transaction.amount));
        });

        const expensesByCategory = Array.from(categoryMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        // Process overdue accounts data
        const today = new Date();
        const overdueInstallments = installments?.filter(i => 
          i.status === 'pending' && new Date(i.due_date) < today
        ) || [];

        const overdueByPeriod = {
          '1-30 dias': 0,
          '31-60 dias': 0,
          '61-90 dias': 0,
          '90+ dias': 0
        };

        overdueInstallments.forEach(installment => {
          const daysDiff = Math.floor((today.getTime() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 30) {
            overdueByPeriod['1-30 dias']++;
          } else if (daysDiff <= 60) {
            overdueByPeriod['31-60 dias']++;
          } else if (daysDiff <= 90) {
            overdueByPeriod['61-90 dias']++;
          } else {
            overdueByPeriod['90+ dias']++;
          }
        });

        const overdueAccounts = Object.entries(overdueByPeriod).map(([period, count]) => ({
          period,
          count
        }));

        setChartData({
          cashFlow: cashFlowData,
          expensesByCategory,
          overdueAccounts
        });
      } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [profile?.tenant_id, dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-80 bg-muted rounded animate-pulse"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cash Flow Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-foreground">Fluxo de Caixa</CardTitle>
              <CardDescription>
                Receitas e despesas do período selecionado
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              {format(dateRange.from, 'dd/MM', { locale: ptBR })} - {format(dateRange.to, 'dd/MM', { locale: ptBR })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'receitas' ? 'Receitas' : 
                    name === 'despesas' ? 'Despesas' : 'Saldo'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Receitas"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Despesas"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Saldo"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Despesas por Categoria</CardTitle>
            <CardDescription>
              Distribuição das principais categorias de despesas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--card-foreground))'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Accounts Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Contas Vencidas</CardTitle>
            <CardDescription>
              Análise de vencimento por período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.overdueAccounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--card-foreground))'
                    }}
                    formatter={(value: number) => [value, 'Contas']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}