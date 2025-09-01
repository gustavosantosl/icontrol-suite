import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallmentTable } from "@/components/installments/InstallmentTable";
import { InstallmentCharts } from "@/components/installments/InstallmentCharts";
import { CreditCard } from "lucide-react";

const Parcelas = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parcelas (Boletos)</h1>
          <p className="text-muted-foreground">
            Gerencie parcelas e acompanhe pagamentos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gerenciamento" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gerenciamento" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Gerenciamento
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerenciamento" className="space-y-6">
          <InstallmentTable />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <InstallmentCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Parcelas;