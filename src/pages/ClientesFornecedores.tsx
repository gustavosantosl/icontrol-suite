import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientesForm } from "@/components/clientes-fornecedores/ClientesForm";
import { ClientesTable } from "@/components/clientes-fornecedores/ClientesTable";
import { FornecedoresForm } from "@/components/clientes-fornecedores/FornecedoresForm";
import { FornecedoresTable } from "@/components/clientes-fornecedores/FornecedoresTable";

const ClientesFornecedores = () => {
  const [activeTab, setActiveTab] = useState("clientes");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Clientes & Fornecedores</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus clientes e fornecedores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientesForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Fornecedor</CardTitle>
            </CardHeader>
            <CardContent>
              <FornecedoresForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <FornecedoresTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientesFornecedores;