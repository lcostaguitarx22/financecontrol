import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Download, Filter, FileSpreadsheet,
  Search, Calendar, TrendingUp, TrendingDown,
  Receipt, CheckCircle2, Clock
} from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { exportToCSV, exportToPDF, ReportItem } from '../utils/exportUtils';

interface ReportPageProps {
  onBack: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({ onBack }) => {
  const { data } = useAppData();

  // Pegar primeiro dia do mês atual
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Compilar dados de transações e contas
  const allData = useMemo(() => {
    const items: ReportItem[] = [];

    const billTxIds = new Set(data.bills.map(b => b.transactionId).filter(Boolean));

    // Adicionar Transações
    data.transactions.forEach(t => {
      if (billTxIds.has(t.id)) return;

      items.push({
        id: t.id,
        date: t.date,
        description: t.description,
        category: t.category || 'Outros',
        type: t.type === 'receita' ? 'Receita' : 'Despesa',
        status: t.type === 'receita' ? 'Crédito' : 'Conta Paga',
        amount: t.amount
      });
    });

    // Adicionar Contas
    data.bills.forEach(b => {
      let type: ReportItem['type'] = 'Conta Variável';
      if (b.fixedBillId) type = 'Conta Fixa';

      let status: ReportItem['status'] = 'Pendente';
      if (b.status === 'pago') status = 'Pago';
      if (b.status === 'atrasado') status = 'Atrasado';

      items.push({
        id: b.id,
        date: b.dueDate,
        description: b.title,
        category: b.category || 'Contas',
        type,
        status,
        amount: b.amount
      });
    });

    // Ordenar por data decrescente
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, data.bills]);

  // Aplicar Filtros
  const filteredData = useMemo(() => {
    return allData.filter(item => {
      // Filtro de Data
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Filtro de Tipo
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Filtro de Categoria
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Filtro de Status
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Filtro de Busca (Descrição)
      if (searchTerm && !item.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [allData, startDate, endDate, typeFilter, categoryFilter, statusFilter, searchTerm]);

  // Estatísticas do Filtro Atual
  const stats = useMemo(() => {
    let receitas = 0;
    let despesas = 0;

    filteredData.forEach(item => {
      if (item.type === 'Receita') {
        receitas += item.amount;
      } else {
        // Despesas, Contas Fixas e Contas Variáveis
        // Se for conta, só conta como despesa real se estiver paga ou se quisermos ver o "previsto"
        // Para relatório geral, vamos somar tudo que é saída.
        despesas += item.amount;
      }
    });

    return { receitas, despesas, total: receitas - despesas };
  }, [filteredData]);

  const handleExportCSV = () => {
    const filename = `Relatorio_Financeiro_${startDate}_a_${endDate}`;
    exportToCSV(filteredData, filename);
  };

  const handleExportPDF = () => {
    const filename = `Relatorio_Financeiro_${startDate}_a_${endDate}`;
    exportToPDF(filteredData, filename);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
      case 'Conta Paga':
      case 'Crédito':
      case 'Concluído':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'Atrasado':
        return 'text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400';
      case 'Pendente':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Receita': return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Despesa': return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
      default: return <Receipt className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const categories = data.settings.categories || [];

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-indigo-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Relatório Detalhado</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={filteredData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">

        {/* FILTROS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold mb-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            <h3>Filtros Avançados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Datas */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Data Inicial</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm py-2 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit]:dark:text-transparent"
                  />
                  <div className="absolute left-9 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-1 py-0.5">
                    {formatDateBr(startDate)}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Data Final</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm py-2 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit]:dark:text-transparent"
                  />
                  <div className="absolute left-9 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-1 py-0.5">
                    {formatDateBr(endDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Busca */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Palavra-chave</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm py-2 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Tipo de Registro</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="all">Todos os Tipos</option>
                <option value="Receita">Receitas</option>
                <option value="Despesa">Despesas Avulsas</option>
                <option value="Conta Fixa">Contas Fixas</option>
                <option value="Conta Variável">Contas Variáveis</option>
              </select>
            </div>

            {/* Categoria e Status */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Categoria</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                >
                  <option value="all">Todas</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="Pago">Pago / Concluído</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMO DOS DADOS FILTRADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 text-center">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Entradas</p>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.receitas, data.settings.currency)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-rose-100 dark:border-rose-900/30 text-center">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Saídas</p>
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(stats.despesas, data.settings.currency)}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-3xl shadow-md text-center text-white">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-1">Balanço</p>
            <p className="text-sm font-black">{formatCurrency(stats.total, data.settings.currency)}</p>
          </div>
        </div>

        {/* TABELA DE RESULTADOS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Resultados <span className="text-slate-400 font-normal">({filteredData.length})</span>
            </h3>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhum registro encontrado para estes filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="pb-3 pr-4 whitespace-nowrap">Data</th>
                    <th className="pb-3 pr-4">Descrição</th>
                    <th className="pb-3 pr-4">Categoria</th>
                    <th className="pb-3 pr-4">Tipo</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDateBr(item.date)}
                      </td>
                      <td className="py-3 pr-4 text-xs font-bold text-slate-900 dark:text-white min-w-[120px]">
                        {item.description}
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-slate-500 font-medium">
                        {item.category}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {getTypeIcon(item.type)}
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{item.type}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={`py-3 text-right text-xs font-black whitespace-nowrap ${item.type === 'Receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                        {item.type === 'Receita' ? '+' : '-'} {formatCurrency(item.amount, data.settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
