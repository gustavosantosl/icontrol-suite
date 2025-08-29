import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  status: 'pendente' | 'pago' | 'vencido';
  due_date: string | null;
}

interface SummaryCardsProps {
  transactions: Transaction[];
  dateRange: { from: Date; to: Date };
}

export function SummaryCards({ transactions, dateRange }: SummaryCardsProps) {
  const summary = useMemo(() => {
    const receitas = transactions
      .filter(t => t.type === 'RECEITA')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const despesas = transactions
      .filter(t => t.type === 'DESPESA')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const saldoLiquido = receitas - despesas;

    const contasPendentes = transactions
      .filter(t => t.status === 'pendente')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const contasVencidas = transactions
      .filter(t => t.status === 'vencido')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      receitas,
      despesas,
      saldoLiquido,
      contasPendentes,
      contasVencidas
    };
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const cards = [
    {
      title: "Total de Receitas",
      value: formatCurrency(summary.receitas),
      icon: TrendingUp,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      title: "Total de Despesas", 
      value: formatCurrency(summary.despesas),
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      title: "Saldo Líquido",
      value: formatCurrency(summary.saldoLiquido),
      icon: DollarSign,
      color: summary.saldoLiquido >= 0 ? "text-brand-accent" : "text-destructive",
      bgColor: summary.saldoLiquido >= 0 ? "bg-brand-accent/10" : "bg-destructive/10"
    },
    {
      title: "Contas Pendentes",
      value: formatCurrency(summary.contasPendentes),
      icon: AlertCircle,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            {card.title === "Saldo Líquido" && (
              <p className="text-xs text-muted-foreground mt-1">
                {summary.saldoLiquido >= 0 ? "Resultado positivo" : "Resultado negativo"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}