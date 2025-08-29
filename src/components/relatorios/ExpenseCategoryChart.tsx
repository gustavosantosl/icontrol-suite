import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  description: string;
}

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
}

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'DESPESA');
    
    // Group by category based on description keywords
    const categories = {
      'Fornecedores': ['fornecedor', 'compra', 'material', 'produto'],
      'Funcionários': ['salário', 'funcionário', 'folha', 'pagamento'],
      'Impostos': ['imposto', 'taxa', 'tributo', 'ir', 'icms', 'iss'],
      'Utilidades': ['luz', 'água', 'telefone', 'internet', 'energia'],
      'Aluguel': ['aluguel', 'locação', 'imóvel'],
      'Marketing': ['marketing', 'publicidade', 'propaganda', 'anúncio'],
      'Outros': []
    };

    const categoryTotals: { [key: string]: number } = {};
    
    // Initialize all categories
    Object.keys(categories).forEach(cat => categoryTotals[cat] = 0);

    expenses.forEach(expense => {
      const description = expense.description.toLowerCase();
      let categorized = false;

      // Check each category for keywords
      for (const [category, keywords] of Object.entries(categories)) {
        if (category === 'Outros') continue;
        
        if (keywords.some(keyword => description.includes(keyword))) {
          categoryTotals[category] += Number(expense.amount);
          categorized = true;
          break;
        }
      }

      // If not categorized, add to "Outros"
      if (!categorized) {
        categoryTotals['Outros'] += Number(expense.amount);
      }
    });

    // Convert to chart format and filter out zero values
    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = [
    'hsl(var(--brand-primary))',
    'hsl(var(--brand-accent))',
    'hsl(var(--destructive))',
    'hsl(var(--brand-primary-light))',
    'hsl(var(--brand-accent-light))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--brand-primary-dark))'
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          Despesas por Categoria
        </CardTitle>
        <CardDescription>
          Distribuição dos gastos por categoria ({formatCurrency(totalExpenses)} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}