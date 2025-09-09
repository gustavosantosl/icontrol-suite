import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

// Schema de validação em português
const esquemaTransacao = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number().min(0.01, 'Valor deve ser positivo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  tipo: z.enum(['entrada', 'saida'], {
    required_error: 'Tipo é obrigatório',
  }),
});

type DadosTransacao = z.infer<typeof esquemaTransacao>;

interface NovaTransacaoProps {
  aoSucesso?: () => void;
}

export function NovaTransacao({ aoSucesso }: NovaTransacaoProps) {
  const { toast } = useToast();
  const { profile } = useTenant();
  const [carregando, setCarregando] = React.useState(false);

  const formulario = useForm<DadosTransacao>({
    resolver: zodResolver(esquemaTransacao),
    defaultValues: {
      descricao: '',
      valor: 0,
      categoria: '',
      tipo: undefined,
    },
  });

  const aoSubmeter = async (dados: DadosTransacao) => {
    if (!profile?.tenant_id) {
      toast({
        title: 'Erro',
        description: 'Perfil não encontrado',
        variant: 'destructive',
      });
      return;
    }

    setCarregando(true);

    try {
      // Inserir nova transação no Supabase
      const { error } = await supabase
        .from('transactions')
        .insert({
          description: `${dados.categoria} - ${dados.descricao}`,
          amount: dados.valor,
          type: dados.tipo,
          tenant_id: profile.tenant_id,
          status: 'pendente',
        });

      if (error) {
        throw error;
      }

      // Resetar formulário
      formulario.reset();

      // Mostrar mensagem de sucesso
      toast({
        title: 'Sucesso',
        description: 'Transação cadastrada com sucesso!',
      });

      // Chamar callback de sucesso
      aoSucesso?.();
    } catch (erro) {
      console.error('Erro ao cadastrar transação:', erro);
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar transação.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <Form {...formulario}>
          <form onSubmit={formulario.handleSubmit(aoSubmeter)} className="space-y-4">
            <FormField
              control={formulario.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite a descrição" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite a categoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Cadastrando...' : 'Cadastrar Transação'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}