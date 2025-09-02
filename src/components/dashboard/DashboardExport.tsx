import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardExportProps {
  kpiData?: {
    monthlyIncome: number;
    monthlyExpenses: number;
    currentBalance: number;
    overdueAccounts: number;
  };
}

export function DashboardExport({ kpiData }: DashboardExportProps) {
  const { profile, tenant } = useTenant();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const fetchDashboardData = async () => {
    if (!profile?.tenant_id) return null;

    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      const { data: installments } = await supabase
        .from('installments')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('due_date', { ascending: false });

      return { transactions: transactions || [], installments: installments || [] };
    } catch (error) {
      console.error('Erro ao buscar dados para export:', error);
      return null;
    }
  };

  const exportToPDF = async () => {
    try {
      const data = await fetchDashboardData();
      if (!data) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados para exportação.",
          variant: "destructive"
        });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const today = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
      const tenantName = tenant?.name || 'iControl';
      
      // Header
      doc.setFontSize(20);
      doc.text('Dashboard iControl', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Empresa: ${tenantName}`, 20, 35);
      doc.text(`Data: ${today}`, 20, 45);
      
      // KPIs Summary
      doc.setFontSize(16);
      doc.text('Resumo Financeiro', 20, 65);
      
      if (kpiData) {
        doc.setFontSize(10);
        doc.text(`Receitas do Mês: ${formatCurrency(kpiData.monthlyIncome)}`, 20, 80);
        doc.text(`Despesas do Mês: ${formatCurrency(kpiData.monthlyExpenses)}`, 20, 90);
        doc.text(`Saldo Atual: ${formatCurrency(kpiData.currentBalance)}`, 20, 100);
        doc.text(`Contas em Atraso: ${kpiData.overdueAccounts}`, 20, 110);
      }

      // Recent Transactions
      doc.setFontSize(16);
      doc.text('Transações Recentes', 20, 130);
      
      const recentTransactions = data.transactions.slice(0, 10);
      let yPosition = 145;
      
      doc.setFontSize(10);
      recentTransactions.forEach((transaction, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const date = format(new Date(transaction.created_at!), 'dd/MM/yyyy');
        const amount = formatCurrency(transaction.amount);
        const type = transaction.type === 'RECEITA' ? 'Receita' : 'Despesa';
        
        doc.text(`${date} - ${transaction.description} - ${type}: ${amount}`, 20, yPosition);
        yPosition += 10;
      });

      // Save
      const fileName = `Dashboard_iControl_${tenantName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Sucesso",
        description: "Dashboard exportado para PDF com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar arquivo PDF.",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = async () => {
    try {
      const data = await fetchDashboardData();
      if (!data) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados para exportação.",
          variant: "destructive"
        });
        return;
      }

      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['Resumo do Dashboard', '', '', ''],
        ['', '', '', ''],
        ['Empresa:', tenant?.name || 'iControl', '', ''],
        ['Data:', format(new Date(), 'dd/MM/yyyy', { locale: ptBR }), '', ''],
        ['', '', '', ''],
        ['KPI', 'Valor', '', ''],
        ['Receitas do Mês', kpiData?.monthlyIncome || 0, '', ''],
        ['Despesas do Mês', kpiData?.monthlyExpenses || 0, '', ''],
        ['Saldo Atual', kpiData?.currentBalance || 0, '', ''],
        ['Contas em Atraso', kpiData?.overdueAccounts || 0, '', '']
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      // Transactions Sheet
      const transactionsData = data.transactions.map(transaction => ({
        'Data': format(new Date(transaction.created_at!), 'dd/MM/yyyy'),
        'Descrição': transaction.description,
        'Tipo': transaction.type === 'RECEITA' ? 'Receita' : 'Despesa',
        'Valor': transaction.amount,
        'Status': transaction.status
      }));

      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transações');

      // Installments Sheet
      const installmentsData = data.installments.map(installment => ({
        'Número': installment.installment_number,
        'Data de Vencimento': format(new Date(installment.due_date), 'dd/MM/yyyy'),
        'Valor': installment.value,
        'Status': installment.status === 'pending' ? 'Pendente' : installment.status === 'paid' ? 'Pago' : 'Vencido'
      }));

      if (installmentsData.length > 0) {
        const installmentsSheet = XLSX.utils.json_to_sheet(installmentsData);
        XLSX.utils.book_append_sheet(workbook, installmentsSheet, 'Parcelas');
      }

      // Save
      const fileName = `Dashboard_iControl_${tenant?.name || 'iControl'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Sucesso",
        description: "Dashboard exportado para Excel com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar arquivo Excel.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToPDF}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        PDF
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToExcel}
        className="gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Excel
      </Button>
    </div>
  );
}