import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter,
  CreditCard,
  Wallet,
  Building2,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Contas = () => {
  const accounts = [
    {
      id: 1,
      name: "Conta Corrente Principal",
      type: "Corrente",
      bank: "Banco do Brasil",
      balance: "R$ 25.430,50",
      status: "Ativa",
      icon: Building2,
    },
    {
      id: 2,
      name: "Poupança Reserva",
      type: "Poupança", 
      bank: "Caixa Econômica",
      balance: "R$ 15.670,25",
      status: "Ativa",
      icon: Wallet,
    },
    {
      id: 3,
      name: "Cartão Empresarial",
      type: "Cartão de Crédito",
      bank: "Itaú",
      balance: "-R$ 3.250,00",
      status: "Ativa",
      icon: CreditCard,
    },
    {
      id: 4,
      name: "Investimentos",
      type: "Investimento",
      bank: "XP Investimentos",
      balance: "R$ 45.890,75",
      status: "Ativa", 
      icon: TrendingUp,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativa":
        return "bg-green-100 text-green-800 border-green-200";
      case "Inativa":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getBalanceColor = (balance: string) => {
    return balance.startsWith('-') ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e cartões
          </p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ 83.741,50
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +12.5% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              4
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as contas funcionando
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maior Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-accent">
              R$ 45.890,75
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Investimentos - XP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar contas..." 
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="shadow-md hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <account.icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription>{account.bank}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(account.status)}>
                  {account.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="font-medium">{account.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span className={`text-xl font-bold ${getBalanceColor(account.balance)}`}>
                    {account.balance}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Contas;