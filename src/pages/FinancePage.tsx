/**
 * @file FinancePage.tsx
 * @description Tela Extrato Financeiro com histórico de movimentações, exportação CSV, despesas por categoria e alertas de orçamento dinâmicos.
 */

import React, { useState } from 'react';
import {
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  AlertTriangle,
  Utensils,
  Briefcase,
  Car,
  ShoppingBag,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { deleteTransaction } from '../services/storage';
import { NewTransactionModal } from '../components/modals/NewTransactionModal';
import { BudgetLimitsModal } from '../components/modals/BudgetLimitsModal';
import { FinanceBudget } from '../components/FinanceBudget';

export const FinancePage: React.FC = () => {
  const { data } = useAppData();
  const [activeTab, setActiveTab] = useState<'extrato' | 'orcamento'>('extrato');
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('todas');

  // Calcular totais
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [currYear, currMonth] = currentMonthKey.split('-').map(Number);

  let totalReceitas = data.transactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);

  // Adiciona automaticamente o salário fixo se a data for >= final do mês (dia de pagamento) ou mês passado
  Object.entries(data.monthlySalaries || {}).forEach(([monthKey, salary]) => {
    const [y, m] = monthKey.split('-').map(Number);
    const lastDayOfMonth = new Date(currYear, currMonth, 0).getDate();
    // Consideramos pago se:
    // 1. O mês for no passado
    // 2. Ou se for o mês atual e hoje for dia >= (último dia do mês ou dia 30, o que for menor)
    const paymentDay = Math.min(30, lastDayOfMonth);
    if (y < currYear || (y === currYear && m < currMonth)) {
       totalReceitas += salary;
    } else if (y === currYear && m === currMonth && currentDay >= paymentDay) {
       totalReceitas += salary;
    }
  });

  const totalDespesas = data.transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoMes = totalReceitas - totalDespesas;

  // Cálculo de Previsão Próximo Mês
  const nextMonthD = new Date();
  nextMonthD.setMonth(nextMonthD.getMonth() + 1);
  const nextMonthKey = `${nextMonthD.getFullYear()}-${String(nextMonthD.getMonth() + 1).padStart(2, '0')}`;

  const knownSalaries = Object.entries(data.monthlySalaries || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(e => e[1]);
  const lastKnownSalary = knownSalaries.length > 0 ? knownSalaries[knownSalaries.length - 1] : (data.salary || 0);

  const nextMonthSalary = data.monthlySalaries?.[nextMonthKey] ?? lastKnownSalary;
  const nextMonthExtra = data.monthlyExtras?.[nextMonthKey] ?? 0;

  const previsaoReceitas = nextMonthSalary + nextMonthExtra;
  const previsaoDespesas = (data.fixedBills || []).reduce((acc, b) => acc + b.amount, 0);

  // Filtrar transações
  const filteredTransactions = data.transactions.filter((t) => {
    if (filterCategory === 'todas') return true;
    return t.category.toLowerCase() === filterCategory.toLowerCase();
  });

  // Calcular despesas por categoria dinamicamente
  const expensesByCategory = data.transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const colors = ['#ec4899', '#6366f1', '#f97316', '#10b981', '#8b5cf6'];
  const categoryExpenses = Object.entries(expensesByCategory)
    .map(([name, value], index) => ({
      name,
      value: Number(value),
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);

  const hasExpenses = categoryExpenses.length > 0;
  const pieData = hasExpenses ? categoryExpenses : [{ name: 'Vazio', value: 1, color: '#e2e8f0' }];

  // Verificar orçamento (budget) - pega o primeiro que excedeu ou tem alto uso
  let highestBudgetAlert = null;
  if (data.budgets && data.budgets.length > 0) {
    const highest = [...data.budgets].sort((a, b) => b.usedPercentage - a.usedPercentage)[0];
    if (highest.usedPercentage >= 80) {
      highestBudgetAlert = highest;
    }
  }

  // Função para exportar CSV real
  const handleExportCsv = () => {
    const headers = ['ID', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Data'];
    const rows = data.transactions.map((t) => [
      t.id,
      `"${t.description}"`,
      t.amount,
      t.type,
      `"${t.category}"`,
      t.date,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_financecontrol_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'alimentação':
        return <Utensils className="w-4 h-4 text-pink-600" />;
      case 'renda':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'transporte':
        return <Car className="w-4 h-4 text-orange-600" />;
      case 'compras':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Título e Sub-Navegação */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financeiro
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão e Orçamento
          </p>
        </div>

        {/* Toggle Extrato / Orçamento */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('extrato')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'extrato'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            Extrato
          </button>
          <button
            onClick={() => setActiveTab('orcamento')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'orcamento'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            Previsão
          </button>
        </div>
      </div>

      {activeTab === 'orcamento' ? (
        <FinanceBudget />
      ) : (
        <>
          {/* Saldo do Mês */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-xl shadow-indigo-200/50 dark:shadow-none border border-indigo-800/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Saldo do Mês</p>
              <p className="text-2xl font-extrabold text-white tracking-tight">
                {formatCurrency(saldoMes, data.settings.currency)}
              </p>
            </div>
            <div className="p-3 bg-indigo-600/40 rounded-2xl text-indigo-200 border border-indigo-400/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Botões de Ação Superior */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportCsv}
              id="finance-export-csv-btn"
              className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-50/50 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-600" /> Exportar CSV
            </button>
            <button
              onClick={() => setShowNewTxModal(true)}
              id="finance-new-tx-btn"
              className="py-2.5 px-3 bg-indigo-600 dark:bg-indigo-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" /> Nova Transação
            </button>
          </div>

          {/* Cards de Métricas */}
          <div className="space-y-3">
            {/* Receitas */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-indigo-100/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">
                  Receitas
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(totalReceitas, data.settings.currency)}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5px]" />
              </div>
            </div>

            {/* Despesas */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-indigo-100/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider mb-1">
                  Despesas
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(totalDespesas, data.settings.currency)}
                </p>
              </div>
              <div className="p-3 bg-pink-50 dark:bg-pink-950/60 text-pink-600 rounded-2xl">
                <ArrowDownRight className="w-5 h-5 stroke-[2.5px]" />
              </div>
            </div>
            {/* Previsão Próximo Mês */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-3">
                Orçamento Previsto (Próximo Mês)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">RECEITAS</p>
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(previsaoReceitas, data.settings.currency)}
                  </p>

                  <p className="text-[10px] text-slate-400 font-semibold mt-3 mb-1">SALÁRIO ACUMULADO</p>
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(saldoMes + previsaoReceitas, data.settings.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">DESPESAS FIXAS</p>
                  <p className="text-sm font-extrabold text-pink-600 dark:text-pink-400">
                    {formatCurrency(previsaoDespesas, data.settings.currency)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-3 mb-1">SALÁRIO ATUAL COM DESCONTO</p>
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(saldoMes - previsaoDespesas, data.settings.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Transações Recentes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Transações Recentes
              </h3>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-full border-none focus:outline-none cursor-pointer"
              >
                <option value="todas">Ver todas</option>
                <option value="alimentação">Alimentação</option>
                <option value="renda">Renda</option>
                <option value="transporte">Transporte</option>
                <option value="compras">Compras</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6 font-medium">
                  Nenhuma transação encontrada nesta categoria.
                </p>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center">
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {formatDateBr(tx.date)} • {tx.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold ${tx.type === 'receita'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-pink-600 dark:text-pink-400'
                          }`}
                      >
                        {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount, data.settings.currency)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="opacity-100 group-hover:opacity-100 p-1 text-slate-400 hover:text-pink-600 transition-opacity"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Despesas por Categoria */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
              Despesas por Categoria
            </h3>

            <div className="relative flex justify-center my-2">
              <div className="w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Label central no Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(totalDespesas, data.settings.currency)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-3 border-t border-indigo-100 dark:border-slate-800">
              {!hasExpenses ? (
                <p className="text-center text-xs text-slate-400">Nenhuma despesa registrada.</p>
              ) : (
                categoryExpenses.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {((item.value / totalDespesas) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Alerta de Orçamento */}
          {highestBudgetAlert && (
            <div className="bg-pink-50/90 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/40 rounded-3xl p-5 relative overflow-hidden shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-pink-100 dark:bg-pink-900/50 rounded-2xl text-pink-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-pink-900 dark:text-pink-200 text-xs mb-1">
                    Alerta de Orçamento
                  </h4>
                  <p className="text-xs text-pink-700 dark:text-pink-300 leading-relaxed font-medium">
                    Você já atingiu {highestBudgetAlert.usedPercentage}% do seu orçamento planejado para {highestBudgetAlert.name} neste mês.
                  </p>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    id="finance-adjust-limits-btn"
                    className="mt-2 text-xs font-bold text-pink-700 dark:text-pink-300 underline hover:text-pink-900 block"
                  >
                    Ajustar Limites
                  </button>
                </div>
              </div>
            </div>
          )}

          {showNewTxModal && <NewTransactionModal onClose={() => setShowNewTxModal(false)} />}
          {showBudgetModal && <BudgetLimitsModal onClose={() => setShowBudgetModal(false)} />}
        </>
      )}
    </div>
  );
};
