import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Edit2, Check, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface InstallmentData {
  installment_number: number;
  due_date: Date;
  value: number;
  emission_date: Date;
  status: 'pending' | 'paid' | 'overdue';
}

interface InstallmentFormProps {
  onInstallmentsChange: (installments: InstallmentData[]) => void;
  totalValue: number;
  isVisible: boolean;
}

export function InstallmentForm({ onInstallmentsChange, totalValue, isVisible }: InstallmentFormProps) {
  const [numInstallments, setNumInstallments] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState<Date>();
  const [intervalDays, setIntervalDays] = useState(30);
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState<Date>();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  };

  const generateInstallments = () => {
    if (!firstDueDate || numInstallments < 1 || totalValue <= 0) return;

    const installmentValue = totalValue / numInstallments;
    const today = new Date();
    
    const newInstallments: InstallmentData[] = [];
    
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = addDays(firstDueDate, i * intervalDays);
      
      newInstallments.push({
        installment_number: i + 1,
        due_date: dueDate,
        value: i === numInstallments - 1 
          ? totalValue - (installmentValue * (numInstallments - 1)) // Ajuste na última parcela
          : installmentValue,
        emission_date: today,
        status: 'pending'
      });
    }
    
    setInstallments(newInstallments);
    onInstallmentsChange(newInstallments);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(formatCurrency(installments[index].value));
    setEditDate(installments[index].due_date);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    
    const newInstallments = [...installments];
    newInstallments[editingIndex] = {
      ...newInstallments[editingIndex],
      value: parseCurrency(editValue),
      due_date: editDate || newInstallments[editingIndex].due_date
    };
    
    setInstallments(newInstallments);
    onInstallmentsChange(newInstallments);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
    setEditDate(undefined);
  };

  useEffect(() => {
    if (firstDueDate && numInstallments > 0 && totalValue > 0) {
      generateInstallments();
    }
  }, [numInstallments, firstDueDate, intervalDays, totalValue]);

  if (!isVisible) return null;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-brand-primary">Gerar Parcelas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numInstallments">Número de Parcelas</Label>
            <Input
              id="numInstallments"
              type="number"
              min="1"
              max="48"
              value={numInstallments}
              onChange={(e) => setNumInstallments(parseInt(e.target.value) || 1)}
              placeholder="Ex: 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstDueDate">Primeira Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !firstDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {firstDueDate ? (
                    format(firstDueDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50" align="start">
                <Calendar
                  mode="single"
                  selected={firstDueDate}
                  onSelect={setFirstDueDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intervalDays">Intervalo (dias)</Label>
            <Input
              id="intervalDays"
              type="number"
              min="1"
              max="365"
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value) || 30)}
              placeholder="Ex: 30"
            />
          </div>
        </div>

        {/* Preview Table */}
        {installments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Prévia das Parcelas</h3>
              <div className="text-sm text-muted-foreground">
                Total: {formatCurrency(installments.reduce((sum, inst) => sum + inst.value, 0))}
              </div>
            </div>
            
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Nº</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((installment, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">
                        {installment.installment_number}
                      </TableCell>
                      <TableCell>
                        {editingIndex === index ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editDate ? format(editDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-background border border-border shadow-lg z-50">
                              <Calendar
                                mode="single"
                                selected={editDate}
                                onSelect={setEditDate}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          format(installment.due_date, "dd/MM/yyyy", { locale: ptBR })
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingIndex === index ? (
                          <Input
                            value={editValue}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const formattedValue = (parseInt(value) / 100).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              });
                              setEditValue(value ? formattedValue : '');
                            }}
                            className="w-32 text-right"
                          />
                        ) : (
                          formatCurrency(installment.value)
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingIndex === index ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={saveEdit}
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(index)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}