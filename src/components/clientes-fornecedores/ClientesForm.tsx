import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const clienteSchema = z.object({
  legal_name: z.string().min(1, "Razão Social é obrigatória"),
  trade_name: z.string().optional(),
  tax_id: z.string().min(11, "CNPJ/CPF deve ter pelo menos 11 caracteres"),
  state_registration: z.string().optional(),
  municipal_registration: z.string().optional(),
  email: z.string().email("E-mail inválido").optional(),
  phone: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zipcode: z.string().optional(),
  notes: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClientesFormProps {
  editingCliente?: any;
  onSuccess?: () => void;
}

export const ClientesForm = ({ editingCliente, onSuccess }: ClientesFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: editingCliente || {
      legal_name: "",
      trade_name: "",
      tax_id: "",
      state_registration: "",
      municipal_registration: "",
      email: "",
      phone: "",
      address_street: "",
      address_number: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      address_zipcode: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    try {
      const clienteData = {
        ...data,
        party_type: "CLIENTE",
        name: data.legal_name, // Keep compatibility with existing name field
      };

      if (editingCliente) {
        const { error } = await supabase
          .from("parties")
          .update(clienteData)
          .eq("id", editingCliente.id);
        
        if (error) throw error;
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("parties")
          .insert([clienteData]);
        
        if (error) throw error;
        toast.success("Cliente cadastrado com sucesso!");
        form.reset();
      }
      
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="legal_name">Razão Social *</Label>
          <Input
            id="legal_name"
            {...form.register("legal_name")}
            placeholder="Razão Social da empresa"
          />
          {form.formState.errors.legal_name && (
            <p className="text-sm text-destructive">{form.formState.errors.legal_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade_name">Nome Fantasia</Label>
          <Input
            id="trade_name"
            {...form.register("trade_name")}
            placeholder="Nome fantasia"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">CNPJ/CPF *</Label>
          <Input
            id="tax_id"
            {...form.register("tax_id")}
            placeholder="00.000.000/0000-00"
          />
          {form.formState.errors.tax_id && (
            <p className="text-sm text-destructive">{form.formState.errors.tax_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state_registration">IE/IM</Label>
          <Input
            id="state_registration"
            {...form.register("state_registration")}
            placeholder="Inscrição Estadual/Municipal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="cliente@email.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address_street">Logradouro</Label>
              <Input
                id="address_street"
                {...form.register("address_street")}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_number">Número</Label>
              <Input
                id="address_number"
                {...form.register("address_number")}
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_neighborhood">Bairro</Label>
              <Input
                id="address_neighborhood"
                {...form.register("address_neighborhood")}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_city">Cidade</Label>
              <Input
                id="address_city"
                {...form.register("address_city")}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_state">UF</Label>
              <Input
                id="address_state"
                {...form.register("address_state")}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <div className="space-y-2">
              <Label htmlFor="address_zipcode">CEP</Label>
              <Input
                id="address_zipcode"
                {...form.register("address_zipcode")}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Observações adicionais..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? "Salvando..." : editingCliente ? "Atualizar Cliente" : "Cadastrar Cliente"}
      </Button>
    </form>
  );
};