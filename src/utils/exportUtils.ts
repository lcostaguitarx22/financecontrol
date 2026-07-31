export interface ReportItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  type: 'Receita' | 'Despesa' | 'Conta Fixa' | 'Conta Variável';
  status: 'Pago' | 'Pendente' | 'Atrasado' | 'Concluído';
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
