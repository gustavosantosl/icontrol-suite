import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  created_at: string;
  description: string;
}

interface CashFlowChartProps {
  transactions: Transaction[];
  dateRange: { from: Date; to: Date };
}

export function CashFlowChart({ transactions, dateRange }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    // Generate all months in the date range
    const months = eachMonthOfInterval({
      start: startOfMonth(dateRange.from),
      end: endOfMonth(dateRange.to)
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.created_at);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const receitas = monthTransactions
        .filter(t => t.type === 'RECEITA')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesas = monthTransactions
        .filter(t => t.type === 'DESPESA')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        fullMonth: format(month, 'MMMM yyyy', { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas
      };
    });
  }, [transactions, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          Fluxo de Caixa
        </CardTitle>
        <CardDescription>
          Análise de receitas vs despesas ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))"
                }}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data?.fullMonth || label;
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
                stroke="hsl(var(--brand-accent))" 
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: "hsl(var(--brand-accent))", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="hsl(var(--brand-primary))" 
                strokeWidth={3}
                name="Saldo"
                dot={{ fill: "hsl(var(--brand-primary))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}