import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StatusChartData {
  status: string;
  count: number;
  value: number;
}

interface TimelineData {
  month: string;
  pendentes: number;
  pagas: number;
  atrasadas: number;
}

export function InstallmentCharts() {
  const { tenantId } = useTenant();
  const [statusData, setStatusData] = useState<StatusChartData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const fetchChartData = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // Fetch installments data
      const { data: installments, error } = await supabase
        .from('installments')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      if (installments) {
        // Process status data
        const today = new Date();
        const statusCounts = {
          pending: { count: 0, value: 0 },
          paid: { count: 0, value: 0 },
          overdue: { count: 0, value: 0 }
        };

        installments.forEach(installment => {
          const dueDate = new Date(installment.due_date);
          let status = installment.status;
          
          // Update overdue status
          if (status === 'pending' && dueDate < today) {
            status = 'overdue';
          }

          if (status in statusCounts) {
            statusCounts[status as keyof typeof statusCounts].count += 1;
            statusCounts[status as keyof typeof statusCounts].value += installment.value;
          }
        });

        const statusChartData: StatusChartData[] = [
          {
            status: 'Pendentes',
            count: statusCounts.pending.count,
            value: statusCounts.pending.value
          },
          {
            status: 'Pagas',
            count: statusCounts.paid.count,
            value: statusCounts.paid.value
          },
          {
            status: 'Atrasadas',
            count: statusCounts.overdue.count,
            value: statusCounts.overdue.value
          }
        ];

        setStatusData(statusChartData);

        // Process timeline data (last 6 months)
        const endDate = new Date();
        const startDate = subMonths(endDate, 5);
        const months = eachMonthOfInterval({ start: startDate, end: endDate });

        const timelineChartData: TimelineData[] = months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);

          const monthInstallments = installments.filter(installment => {
            const dueDate = new Date(installment.due_date);
            return dueDate >= monthStart && dueDate <= monthEnd;
          });

          const pending = monthInstallments.filter(i => {
            const dueDate = new Date(i.due_date);
            return i.status === 'pending' && dueDate >= today;
          }).length;

          const paid = monthInstallments.filter(i => i.status === 'paid').length;
          
          const overdue = monthInstallments.filter(i => {
            const dueDate = new Date(i.due_date);
            return i.status === 'pending' && dueDate < today;
          }).length;

          return {
            month: format(month, 'MMM', { locale: ptBR }),
            pendentes: pending,
            pagas: paid,
            atrasadas: overdue
          };
        });

        setTimelineData(timelineChartData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [tenantId]);

  // Set up real-time updates
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('installments-chart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'installments',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          fetchChartData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-primary">Parcelas por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'count' ? value : formatCurrency(value),
                  name === 'count' ? 'Quantidade' : 'Valor Total'
                ]}
              />
              <Bar dataKey="count" fill="#3b82f6" name="count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-primary">Evolução das Parcelas (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="pendentes" 
                stroke="#eab308" 
                strokeWidth={2}
                name="Pendentes"
              />
              <Line 
                type="monotone" 
                dataKey="pagas" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Pagas"
              />
              <Line 
                type="monotone" 
                dataKey="atrasadas" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Atrasadas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}