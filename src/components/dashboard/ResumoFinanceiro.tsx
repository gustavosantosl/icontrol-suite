import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DadosGraficoBarras {
  mes: string;
  contasAPagar: number;
  contasAReceber: number;
}

interface DadosGraficoPizza {
  status: string;
  quantidade: number;
  cor: string;
}

interface ResumoFinanceiroProps {
  atualizarDados?: number;
}

const coresStatus = {
  pendente: '#f39c12',
  pago: '#27ae60',
  atrasado: '#e74c3c',
};

export function ResumoFinanceiro({ atualizarDados }: ResumoFinanceiroProps) {
  const { profile } = useTenant();
  const [dadosBarras, setDadosBarras] = React.useState<DadosGraficoBarras[]>([]);
  const [dadosPizza, setDadosPizza] = React.useState<DadosGraficoPizza[]>([]);
  const [carregando, setCarregando] = React.useState(false);

  const buscarDadosFinanceiros = React.useCallback(async () => {
    if (!profile?.tenant_id) return;

    setCarregando(true);
    try {
      // Buscar todas as transações do tenant
      const { data: transacoes, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

      if (error) throw error;

      // Processar dados para gráfico de barras (por mês)
      const dadosPorMes: Record<string, { contasAPagar: number; contasAReceber: number }> = {};
      
      // Processar dados para gráfico de pizza (por status)
      const dadosPorStatus: Record<string, number> = {
        pendente: 0,
        pago: 0,
        atrasado: 0,
      };

      transacoes?.forEach((transacao) => {
        const dataTransacao = new Date(transacao.created_at);
        const chaveMs = format(dataTransacao, 'MMM/yy', { locale: ptBR });

        // Inicializar mês se não existir
        if (!dadosPorMes[chaveMs]) {
          dadosPorMes[chaveMs] = { contasAPagar: 0, contasAReceber: 0 };
        }

        // Agregar valores por tipo
        const valor = Number(transacao.amount) || 0;
        if (transacao.type === 'saida' || transacao.type === 'pagar') {
          dadosPorMes[chaveMs].contasAPagar += valor;
        } else if (transacao.type === 'entrada' || transacao.type === 'receber') {
          dadosPorMes[chaveMs].contasAReceber += valor;
        }

        // Contar por status
        const statusAtual = transacao.status?.toLowerCase() || 'pendente';
        
        // Verificar se está atrasado (pendente e vencido)
        let status = statusAtual;
        if (statusAtual === 'pendente' && transacao.due_date) {
          const dataVencimento = new Date(transacao.due_date);
          const hoje = new Date();
          if (dataVencimento < hoje) {
            status = 'atrasado';
          }
        }

        if (dadosPorStatus[status] !== undefined) {
          dadosPorStatus[status]++;
        } else {
          dadosPorStatus['pendente']++;
        }
      });

      // Converter para formato do gráfico de barras
      const dadosBarrasFormatados = Object.entries(dadosPorMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, valores]) => ({
          mes,
          contasAPagar: valores.contasAPagar,
          contasAReceber: valores.contasAReceber,
        }));

      // Converter para formato do gráfico de pizza
      const dadosPizzaFormatados = Object.entries(dadosPorStatus)
        .filter(([, quantidade]) => quantidade > 0)
        .map(([status, quantidade]) => ({
          status: status === 'pendente' ? 'Pendente' : 
                  status === 'pago' ? 'Pago' : 'Atrasado',
          quantidade,
          cor: coresStatus[status as keyof typeof coresStatus],
        }));

      setDadosBarras(dadosBarrasFormatados);
      setDadosPizza(dadosPizzaFormatados);
    } catch (erro) {
      console.error('Erro ao buscar dados financeiros:', erro);
    } finally {
      setCarregando(false);
    }
  }, [profile?.tenant_id]);

  React.useEffect(() => {
    buscarDadosFinanceiros();
  }, [buscarDadosFinanceiros, atualizarDados]);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const tooltipPersonalizado = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-md p-3 shadow-md">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }}>
              {`${item.dataKey === 'contasAPagar' ? 'Contas a Pagar' : 'Contas a Receber'}: ${formatarValor(item.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tooltipPizza = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-md p-3 shadow-md">
          <p className="font-medium">{`${data.name}: ${data.value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Contas a Pagar vs Receber */}
        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar vs Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-muted-foreground" />
                <YAxis 
                  className="text-muted-foreground"
                  tickFormatter={formatarValor}
                />
                <Tooltip content={tooltipPersonalizado} />
                <Legend />
                <Bar 
                  dataKey="contasAPagar" 
                  name="Contas a Pagar"
                  fill="#e74c3c" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="contasAReceber" 
                  name="Contas a Receber"
                  fill="#27ae60" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, quantidade }) => `${status}: ${quantidade}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {dadosPizza.map((entrada, index) => (
                    <Cell key={`cell-${index}`} fill={entrada.cor} />
                  ))}
                </Pie>
                <Tooltip content={tooltipPizza} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}