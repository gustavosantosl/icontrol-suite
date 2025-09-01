import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { InstallmentForm, InstallmentData } from "./InstallmentForm";
import { Plus, CalendarIcon, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TransactionFormData {
  description: string;
  amount: string;
  due_date: Date | undefined;
  type: 'income' | 'expense';
  party_id?: string;
}

interface Party {
  id: string;
  name: string;
  type: string;
}

export function TransactionWithInstallments() {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [generateInstallments, setGenerateInstallments] = useState(false);
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: '',
    due_date: undefined,
    type: 'expense'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  };

  const fetchParties = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name, type')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !tenantId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (generateInstallments && installments.length === 0) {
      toast({
        title: 'Erro',
        description: 'Configure as parcelas antes de salvar',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Create transaction
      const transactionData = {
        description: formData.description,
        amount: parseCurrency(formData.amount),
        due_date: formData.due_date?.toISOString().split('T')[0] || null,
        type: formData.type,
        party_id: formData.party_id || null,
        tenant_id: tenantId,
        status: 'pendente'
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create installments if enabled
      if (generateInstallments && installments.length > 0) {
        const installmentData = installments.map(installment => ({
          transaction_id: transaction.id,
          tenant_id: tenantId,
          installment_number: installment.installment_number,
          due_date: installment.due_date.toISOString().split('T')[0],
          emission_date: installment.emission_date.toISOString().split('T')[0],
          value: installment.value,
          status: installment.status
        }));

        const { error: installmentError } = await supabase
          .from('installments')
          .insert(installmentData);

        if (installmentError) throw installmentError;

        toast({
          title: 'Sucesso',
          description: `Transação criada com ${installments.length} parcelas!`
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Transação criada com sucesso!'
        });
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        due_date: undefined,
        type: 'expense'
      });
      setInstallments([]);
      setGenerateInstallments(false);
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar transação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstallmentsChange = (newInstallments: InstallmentData[]) => {
    setInstallments(newInstallments);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md"
          onClick={fetchParties}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Crie uma nova transação com ou sem parcelas
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Transaction Info */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-brand-primary">Dados da Transação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'income' | 'expense') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="party">Cliente/Fornecedor (opcional)</Label>
                  <Select 
                    value={formData.party_id || ''} 
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, party_id: value || undefined }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      {parties.map((party) => (
                        <SelectItem key={party.id} value={party.id}>
                          {party.name} ({party.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição da transação"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor Total</Label>
                  <Input
                    id="amount"
                    placeholder="R$ 0,00"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formattedValue = (parseInt(value) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      });
                      setFormData(prev => ({ ...prev, amount: value ? formattedValue : '' }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? (
                          format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="installments"
                  checked={generateInstallments}
                  onCheckedChange={(checked) => {
                    setGenerateInstallments(checked as boolean);
                    if (!checked) {
                      setInstallments([]);
                    }
                  }}
                />
                <Label 
                  htmlFor="installments" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Gerar Parcelas (Boletos)
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Installments Form */}
          {generateInstallments && (
            <InstallmentForm
              onInstallmentsChange={handleInstallmentsChange}
              totalValue={parseCurrency(formData.amount)}
              isVisible={generateInstallments}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}