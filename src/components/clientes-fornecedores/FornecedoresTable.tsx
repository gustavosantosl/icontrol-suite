import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { FornecedoresForm } from "./FornecedoresForm";

interface Fornecedor {
  id: string;
  legal_name: string;
  trade_name?: string;
  tax_id: string;
  phone?: string;
  address_city?: string;
  address_state?: string;
  email?: string;
  created_at: string;
}

export const FornecedoresTable = () => {
  const { tenantId } = useTenant();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filteredFornecedores, setFilteredFornecedores] = useState<Fornecedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchFornecedores = async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("party_type", "FORNECEDOR")
        .eq("tenant_id", tenantId) // Filter by tenant
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFornecedores(data || []);
      setFilteredFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchFornecedores();
    }
  }, [tenantId]);

  useEffect(() => {
    const filtered = fornecedores.filter(fornecedor =>
      fornecedor.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor.trade_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFornecedores(filtered);
  }, [searchTerm, fornecedores]);

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Fornecedor excluído com sucesso!");
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      toast.error("Erro ao excluir fornecedor");
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingFornecedor(null);
    fetchFornecedores();
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando fornecedores...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, nome fantasia ou CNPJ/CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ/CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFornecedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredFornecedores.map((fornecedor) => (
                <TableRow key={fornecedor.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{fornecedor.legal_name}</p>
                      {fornecedor.trade_name && (
                        <p className="text-sm text-muted-foreground">{fornecedor.trade_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{fornecedor.tax_id}</TableCell>
                  <TableCell>{fornecedor.phone || "-"}</TableCell>
                  <TableCell>
                    {fornecedor.address_city && fornecedor.address_state
                      ? `${fornecedor.address_city}/${fornecedor.address_state}`
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fornecedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Fornecedor</DialogTitle>
                          </DialogHeader>
                          <FornecedoresForm 
                            editingFornecedor={editingFornecedor} 
                            onSuccess={handleEditSuccess}
                          />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o fornecedor "{fornecedor.legal_name}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(fornecedor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};