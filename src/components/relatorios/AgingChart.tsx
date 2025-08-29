import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, parseISO } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  due_date: string | null;
  status: 'pendente' | 'pago' | 'vencido';
  description: string;
}

interface AgingChartProps {
  transactions: Transaction[];
}

export function AgingChart({ transactions }: AgingChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    
    // Filter only pending transactions with due dates
    const pendingTransactions = transactions.filter(
      t => t.status === 'pendente' && t.due_date
    );

    const aging = {
      '0-30 dias': { receber: 0, pagar: 0 },
      '31-60 dias': { receber: 0, pagar: 0 },
      '61-90 dias': { receber: 0, pagar: 0 },
      '+ 90 dias': { receber: 0, pagar: 0 }
    };

    pendingTransactions.forEach(transaction => {
      if (!transaction.due_date) return;
      
      const dueDate = parseISO(transaction.due_date);
      const daysOverdue = differenceInDays(today, dueDate);
      
      let category: string;
      if (daysOverdue <= 30) {
        category = '0-30 dias';
      } else if (daysOverdue <= 60) {
        category = '31-60 dias';
      } else if (daysOverdue <= 90) {
        category = '61-90 dias';
      } else {
        category = '+ 90 dias';
      }

      const amount = Number(transaction.amount);
      if (transaction.type === 'RECEITA') {
        aging[category as keyof typeof aging].receber += amount;
      } else {
        aging[category as keyof typeof aging].pagar += amount;
      }
    });

    return Object.entries(aging).map(([period, values]) => ({
      period,
      'Contas a Receber': values.receber,
      'Contas a Pagar': values.pagar
    }));
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalReceivables = chartData.reduce((sum, item) => sum + item['Contas a Receber'], 0);
  const totalPayables = chartData.reduce((sum, item) => sum + item['Contas a Pagar'], 0);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          Análise de Vencimentos
        </CardTitle>
        <CardDescription>
          Contas a receber: {formatCurrency(totalReceivables)} | 
          Contas a pagar: {formatCurrency(totalPayables)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
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
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name
                ]}
              />
              <Legend />
              <Bar 
                dataKey="Contas a Receber" 
                fill="hsl(var(--brand-accent))"
                name="Contas a Receber"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Contas a Pagar" 
                fill="hsl(var(--destructive))"
                name="Contas a Pagar"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}