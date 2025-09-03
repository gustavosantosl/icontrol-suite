import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Wallet } from "lucide-react";
import { TransactionForm } from "@/components/contas/TransactionForm";
import { TransactionsList } from "@/components/contas/TransactionsList";
import { ContasSummaryCards } from "@/components/contas/ContasSummaryCards";

const Contas = () => {
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Pagar e Receber</h1>
          <p className="text-muted-foreground">
            Sistema completo de gestão financeira com parcelas automáticas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTransactionFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <ContasSummaryCards />

      {/* Tabs for Pagar/Receber */}
      <Tabs defaultValue="pagar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pagar" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="receber" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Contas a Receber
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagar" className="space-y-6">
          <TransactionsList type="pagar" refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="receber" className="space-y-6">
          <TransactionsList type="receber" refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};

export default Contas;