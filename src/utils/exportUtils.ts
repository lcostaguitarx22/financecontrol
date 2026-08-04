import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  type: string;
  status: string;
  amount: number;
}

export function exportToCSV(data: ReportItem[], filename: string) {
  if (data.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  // BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  
  const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor (R$)'];
  
  const rows = data.map(item => {
    // Format date from YYYY-MM-DD to DD/MM/YYYY
    let formattedDate = item.date;
    if (item.date && item.date.includes('-')) {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // Format amount to Brazilian locale with 2 decimal places
    const formattedAmount = item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Escape quotes in description and category
    const escapeField = (field: string) => {
      const stringField = String(field || '');
      if (stringField.includes(';') || stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    return [
      formattedDate,
      escapeField(item.description),
      escapeField(item.category),
      item.type,
      item.status,
      // Amount doesn't need quotes usually unless it has commas, but in Brazil it does have commas.
      `"${formattedAmount}"`
    ].join(';'); // Using semicolon for Portuguese locale in Excel
  });

  const csvContent = BOM + [headers.join(';'), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: ReportItem[], filename: string) {
  if (data.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Título e Informações do App
    doc.setFontSize(18);
    doc.text('FinanceControl - Relatório Financeiro', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
    
    // Cabeçalhos
    const head = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor (R$)']];
    
    // Linhas de Dados
    const body = data.map(item => {
      let formattedDate = item.date;
      if (item.date && item.date.includes('-')) {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      
      const formattedAmount = item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      return [
        formattedDate,
        item.description,
        item.category,
        item.type,
        item.status,
        formattedAmount
      ];
    });
    
    // Totais
    let receitas = 0;
    let despesas = 0;
    data.forEach(item => {
      if (item.type === 'Receita') receitas += item.amount;
      else despesas += item.amount;
    });
    
    // AutoTable
    autoTable(doc, {
      startY: 35,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' }
      },
      didDrawPage: (hookData: any) => {
        // Rodapé com número da página
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(`Página ${hookData.pageNumber}`, hookData.settings.margin.left, pageHeight - 10);
      }
    });
    
    // Resumo Final
    const finalY = (doc as any).lastAutoTable?.finalY || 40;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Resumo do Relatório:', 14, finalY + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`Total Entradas: R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 18);
    
    doc.setTextColor(244, 63, 94); // rose-500
    doc.text(`Total Saídas: R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 24);
    
    const saldo = receitas - despesas;
    doc.setTextColor(saldo >= 0 ? 16 : 244, saldo >= 0 ? 185 : 63, saldo >= 0 ? 129 : 94);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balanço Final: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 32);

    doc.save(`${filename}.pdf`);
  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + (error.message || 'Desconhecido'));
  }
}
