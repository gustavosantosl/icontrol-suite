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
  monthlyTotals: Array<{
    month: string;
    toPay: number;
    toReceive: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  topParties: Array<{
    name: string;
    totalAmount: number;
    transactionCount: number;
  }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export function DashboardCharts() {
  const { profile } = useTenant();
  const [chartData, setChartData] = useState<ChartData>({
    monthlyTotals: [],
    statusDistribution: [],
    topParties: []
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
        // Get all transactions with parties
        const { data: transactions } = await supabase
          .from('transactions')
          .select(`
            *,
            parties!left(name)
          `)
          .eq('tenant_id', profile.tenant_id);

        // Process monthly totals for last 6 months
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(date);
        }

        const monthlyTotals = months.map(month => {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          
          const monthTransactions = transactions?.filter(t => {
            const transactionDate = new Date(t.created_at!);
            return transactionDate >= monthStart && transactionDate <= monthEnd;
          }) || [];

          const toPay = monthTransactions
            .filter(t => t.type === 'pagar')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const toReceive = monthTransactions
            .filter(t => t.type === 'receber')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          return {
            month: format(month, 'MMM/yy', { locale: ptBR }),
            toPay,
            toReceive
          };
        });

        // Process status distribution
        const statusCounts = {
          pending: 0,
          paid: 0,
          received: 0,
          overdue: 0
        };

        const todayStr = new Date().toISOString().split('T')[0];
        
        transactions?.forEach(transaction => {
          if (transaction.status === 'paid') {
            statusCounts.paid++;
          } else if (transaction.status === 'received') {
            statusCounts.received++;
          } else if (transaction.due_date && transaction.due_date < todayStr) {
            statusCounts.overdue++;
          } else {
            statusCounts.pending++;
          }
        });

        const totalTransactions = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        const statusDistribution = [
          {
            name: 'Pendente',
            value: statusCounts.pending,
            percentage: totalTransactions > 0 ? (statusCounts.pending / totalTransactions) * 100 : 0
          },
          {
            name: 'Pago',
            value: statusCounts.paid,
            percentage: totalTransactions > 0 ? (statusCounts.paid / totalTransactions) * 100 : 0
          },
          {
            name: 'Recebido',
            value: statusCounts.received,
            percentage: totalTransactions > 0 ? (statusCounts.received / totalTransactions) * 100 : 0
          },
          {
            name: 'Vencido',
            value: statusCounts.overdue,
            percentage: totalTransactions > 0 ? (statusCounts.overdue / totalTransactions) * 100 : 0
          }
        ].filter(item => item.value > 0);

        // Process top parties ranking
        const partyMap = new Map<string, { totalAmount: number; transactionCount: number }>();
        
        transactions?.forEach(transaction => {
          const partyName = transaction.parties?.name || 'Sem Cliente/Fornecedor';
          const currentData = partyMap.get(partyName) || { totalAmount: 0, transactionCount: 0 };
          
          partyMap.set(partyName, {
            totalAmount: currentData.totalAmount + Number(transaction.amount),
            transactionCount: currentData.transactionCount + 1
          });
        });

        const topParties = Array.from(partyMap.entries())
          .map(([name, data]) => ({
            name,
            totalAmount: data.totalAmount,
            transactionCount: data.transactionCount
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5);

        setChartData({
          monthlyTotals,
          statusDistribution,
          topParties
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
      {/* Monthly Totals Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Totais Mensais</CardTitle>
          <CardDescription>
            Comparativo mensal de contas a pagar vs. a receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
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
                    name === 'toPay' ? 'A Pagar' : 'A Receber'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="toPay" 
                  fill="#ef4444"
                  name="A Pagar"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="toReceive" 
                  fill="#10b981"
                  name="A Receber"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Distribuição por Status</CardTitle>
            <CardDescription>
              Percentual de transações por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusDistribution.map((entry, index) => (
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
                    formatter={(value: number) => [value, 'Transações']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Parties Ranking */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Top 5 Clientes/Fornecedores</CardTitle>
            <CardDescription>
              Ranking por valor total de transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.topParties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum dado disponível</p>
                </div>
              ) : (
                chartData.topParties.map((party, index) => (
                  <div key={party.name} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{party.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {party.transactionCount} transação{party.transactionCount !== 1 ? 'ões' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {formatCurrency(party.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}