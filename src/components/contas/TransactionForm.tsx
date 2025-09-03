import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar as CalendarIcon, Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface Party {
  id: string;
  name: string;
  type: string;
}

interface InstallmentPreview {
  id?: string;
  installment_number: number;
  emission_date: Date;
  due_date: Date;
  value: number;
  status: 'pending' | 'paid' | 'overdue';
}

interface TransactionFormData {
  type: 'pagar' | 'receber';
  description: string;
  party_id: string;
  total_value: string;
  num_installments: number;
  interval_days: number;
  first_due_date: Date | undefined;
  payment_method: string;
  notes: string;
  generate_installments: boolean;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TransactionForm = ({ open, onOpenChange, onSuccess }: TransactionFormProps) => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pagar',
    description: '',
    party_id: '',
    total_value: '',
    num_installments: 1,
    interval_days: 30,
    first_due_date: new Date(),
    payment_method: 'boleto',
    notes: '',
    generate_installments: true
  });

  const [parties, setParties] = useState<Party[]>([]);
  const [installments, setInstallments] = useState<InstallmentPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Fetch parties for autocomplete
  useEffect(() => {
    if (open) {
      fetchParties();
    }
  }, [open]);

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name, type')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Parse currency string to number
  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  // Generate installments preview
  const generateInstallments = () => {
    if (!formData.total_value || !formData.first_due_date) return;

    const totalValue = parseCurrency(formData.total_value);
    const installmentValue = Math.round((totalValue / formData.num_installments) * 100) / 100;
    let remainingValue = totalValue;

    const newInstallments: InstallmentPreview[] = [];

    for (let i = 1; i <= formData.num_installments; i++) {
      const dueDate = new Date(formData.first_due_date);
      dueDate.setDate(dueDate.getDate() + (i - 1) * formData.interval_days);

      const value = i === formData.num_installments ? remainingValue : installmentValue;
      remainingValue -= value;

      newInstallments.push({
        installment_number: i,
        emission_date: new Date(),
        due_date: dueDate,
        value,
        status: 'pending'
      });
    }

    setInstallments(newInstallments);
    setShowPreview(true);
    validateInstallments(newInstallments, totalValue);
  };

  // Validate installments sum
  const validateInstallments = (installmentsList: InstallmentPreview[], totalValue: number) => {
    const sum = installmentsList.reduce((acc, inst) => acc + inst.value, 0);
    const difference = Math.abs(sum - totalValue);
    
    if (difference > 0.01) {
      setValidationError(`Soma das parcelas (${formatCurrency(sum)}) difere do valor total (${formatCurrency(totalValue)})`);
    } else {
      setValidationError('');
    }
  };

  // Handle installment editing
  const handleEditInstallment = (index: number, field: 'due_date' | 'value', value: any) => {
    const updatedInstallments = [...installments];
    if (field === 'due_date') {
      updatedInstallments[index].due_date = value;
    } else if (field === 'value') {
      updatedInstallments[index].value = parseFloat(value) || 0;
    }
    setInstallments(updatedInstallments);
    validateInstallments(updatedInstallments, parseCurrency(formData.total_value));
  };

  // Add new installment
  const addInstallment = () => {
    const newInstallment: InstallmentPreview = {
      installment_number: installments.length + 1,
      emission_date: new Date(),
      due_date: new Date(),
      value: 0,
      status: 'pending'
    };
    setInstallments([...installments, newInstallment]);
  };

  // Remove installment
  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      const updatedInstallments = installments.filter((_, i) => i !== index);
      // Renumber installments
      updatedInstallments.forEach((inst, i) => {
        inst.installment_number = i + 1;
      });
      setInstallments(updatedInstallments);
      setFormData(prev => ({ ...prev, num_installments: updatedInstallments.length }));
      validateInstallments(updatedInstallments, parseCurrency(formData.total_value));
    }
  };

  // Submit transaction
  const handleSubmit = async () => {
    if (!tenantId || !formData.description || !formData.total_value) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.generate_installments && validationError) {
      toast({
        title: "Erro",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (formData.generate_installments) {
        // Use the SQL function to create transaction with installments
        const { error } = await supabase.rpc('create_transaction_with_installments', {
          p_tenant_id: tenantId,
          p_type: formData.type,
          p_description: formData.description,
          p_total_value: parseCurrency(formData.total_value),
          p_party_id: formData.party_id || null,
          p_num_installments: formData.num_installments,
          p_interval_days: formData.interval_days,
          p_first_due_date: formData.first_due_date?.toISOString().split('T')[0],
          p_payment_method: formData.payment_method
        });

        if (error) throw error;
      } else {
        // Create simple transaction
        const { error } = await supabase
          .from('transactions')
          .insert({
            tenant_id: tenantId,
            type: formData.type,
            description: formData.description,
            party_id: formData.party_id || null,
            amount: parseCurrency(formData.total_value),
            total_value: parseCurrency(formData.total_value),
            due_date: formData.first_due_date?.toISOString().split('T')[0],
            payment_method: formData.payment_method,
            status: 'pending'
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!",
      });

      // Reset form
      setFormData({
        type: 'pagar',
        description: '',
        party_id: '',
        total_value: '',
        num_installments: 1,
        interval_days: 30,
        first_due_date: new Date(),
        payment_method: 'boleto',
        notes: '',
        generate_installments: true
      });
      setInstallments([]);
      setShowPreview(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar transação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Crie uma nova conta a pagar ou receber com parcelas automáticas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'pagar' | 'receber') => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">Conta a Pagar</SelectItem>
                  <SelectItem value="receber">Conta a Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party">Fornecedor/Cliente</Label>
              <Select
                value={formData.party_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, party_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da transação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total *</Label>
              <Input
                id="total_value"
                value={formData.total_value}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formattedValue = (parseInt(value || '0') / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  });
                  setFormData(prev => ({ ...prev, total_value: value ? formattedValue : '' }));
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate_installments"
                  checked={formData.generate_installments}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, generate_installments: !!checked }))}
                />
                <Label htmlFor="generate_installments">Gerar parcelas automaticamente</Label>
              </div>
            </div>

            {formData.generate_installments && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="num_installments">Número de Parcelas</Label>
                  <Input
                    id="num_installments"
                    type="number"
                    min="1"
                    value={formData.num_installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, num_installments: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval_days">Dias entre Parcelas</Label>
                  <Input
                    id="interval_days"
                    type="number"
                    min="1"
                    value={formData.interval_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval_days: parseInt(e.target.value) || 30 }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="first_due_date">Data da Primeira Parcela</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.first_due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.first_due_date ? (
                          format(formData.first_due_date, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.first_due_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, first_due_date: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateInstallments}
                    disabled={!formData.total_value || !formData.first_due_date}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Gerar Parcelas
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Installments Preview */}
          {showPreview && installments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Prévia das Parcelas
                  {validationError && (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                </CardTitle>
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment, index) => (
                      <TableRow key={index}>
                        <TableCell>{installment.installment_number}</TableCell>
                        <TableCell>
                          {format(installment.emission_date, "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {editingInstallment === index ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  {format(installment.due_date, "dd/MM/yyyy")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={installment.due_date}
                                  onSelect={(date) => {
                                    if (date) {
                                      handleEditInstallment(index, 'due_date', date);
                                    }
                                  }}
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            format(installment.due_date, "dd/MM/yyyy")
                          )}
                        </TableCell>
                        <TableCell>
                          {editingInstallment === index ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={installment.value}
                              onChange={(e) => handleEditInstallment(index, 'value', e.target.value)}
                              className="w-24"
                            />
                          ) : (
                            formatCurrency(installment.value)
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {editingInstallment === index ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingInstallment(null)}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingInstallment(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingInstallment(index)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeInstallment(index)}
                                  disabled={installments.length <= 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInstallment}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Parcela
                  </Button>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(installments.reduce((sum, inst) => sum + inst.value, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (formData.generate_installments && !!validationError)}
            >
              {loading ? "Salvando..." : "Salvar Transação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};