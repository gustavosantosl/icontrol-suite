import { Button } from "@/components/ui/button";
import { Download, FileText, Table } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  status: 'pendente' | 'pago' | 'vencido';
  description: string;
  due_date: string | null;
  created_at: string;
}

interface ExportButtonsProps {
  transactions: Transaction[];
  dateRange: { from: Date; to: Date };
}

export function ExportButtons({ transactions, dateRange }: ExportButtonsProps) {
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSummaryData = () => {
    const receitas = transactions
      .filter(t => t.type === 'RECEITA')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const despesas = transactions
      .filter(t => t.type === 'DESPESA')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      totalTransacoes: transactions.length
    };
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const summary = getSummaryData();
      
      // Header
      doc.setFontSize(20);
      doc.text('Relatório Financeiro - iControl', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 45);
      
      // Summary
      doc.setFontSize(16);
      doc.text('Resumo Geral', 20, 65);
      
      doc.setFontSize(12);
      doc.text(`Total de Receitas: ${formatCurrency(summary.receitas)}`, 20, 80);
      doc.text(`Total de Despesas: ${formatCurrency(summary.despesas)}`, 20, 90);
      doc.text(`Saldo Líquido: ${formatCurrency(summary.saldo)}`, 20, 100);
      doc.text(`Total de Transações: ${summary.totalTransacoes}`, 20, 110);
      
      // Transactions table
      doc.setFontSize(16);
      doc.text('Transações Detalhadas', 20, 130);
      
      let yPos = 145;
      doc.setFontSize(10);
      
      // Table headers
      doc.text('Data', 20, yPos);
      doc.text('Descrição', 50, yPos);
      doc.text('Tipo', 120, yPos);
      doc.text('Valor', 150, yPos);
      doc.text('Status', 180, yPos);
      
      yPos += 10;
      
      // Table data
      transactions.slice(0, 30).forEach(transaction => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const date = format(new Date(transaction.created_at), 'dd/MM/yy', { locale: ptBR });
        const description = transaction.description.substring(0, 25) + (transaction.description.length > 25 ? '...' : '');
        
        doc.text(date, 20, yPos);
        doc.text(description, 50, yPos);
        doc.text(transaction.type, 120, yPos);
        doc.text(formatCurrency(Number(transaction.amount)), 150, yPos);
        doc.text(transaction.status.toUpperCase(), 180, yPos);
        
        yPos += 8;
      });
      
      if (transactions.length > 30) {
        doc.text(`... e mais ${transactions.length - 30} transações`, 20, yPos + 10);
      }
      
      doc.save(`relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      
      toast({
        title: "PDF Exportado",
        description: "Relatório financeiro exportado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = () => {
    try {
      const summary = getSummaryData();
      
      // Summary sheet
      const summaryData = [
        ['Relatório Financeiro - iControl'],
        [`Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`],
        [`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`],
        [],
        ['Resumo Geral'],
        ['Total de Receitas', formatCurrency(summary.receitas)],
        ['Total de Despesas', formatCurrency(summary.despesas)],
        ['Saldo Líquido', formatCurrency(summary.saldo)],
        ['Total de Transações', summary.totalTransacoes]
      ];
      
      // Transactions data
      const transactionsData = [
        ['Data', 'Descrição', 'Tipo', 'Valor', 'Status', 'Data Vencimento'],
        ...transactions.map(t => [
          format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ptBR }),
          t.description,
          t.type,
          Number(t.amount),
          t.status.toUpperCase(),
          t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'
        ])
      ];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add summary sheet
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
      
      // Add transactions sheet
      const transactionsWs = XLSX.utils.aoa_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transações');
      
      // Save file
      XLSX.writeFile(wb, `relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
      
      toast({
        title: "Excel Exportado",
        description: "Relatório financeiro exportado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar o Excel. Tente novamente.",
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
        Exportar PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToExcel}
        className="gap-2"
      >
        <Table className="w-4 h-4" />
        Exportar Excel
      </Button>
    </div>
  );
}