/**
 * @file HomePage.tsx
 * @description Tela Visão Geral (Home) com cálculos dinâmicos reais usando dados do banco.
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  MoreVertical,
  Calendar,
  CreditCard,
  Zap,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency, formatBtc } from '../utils/formatters';
import { TabType } from '../types';

interface HomePageProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenRendimento?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateTab, onOpenRendimento }) => {
  const { data } = useAppData();
  const [period, setPeriod] = useState('Este Mês');

  // Sparkline mock data para o card de cripto
  const cryptoSparklineData = [
    { v: 10 }, { v: 15 }, { v: 14 }, { v: 22 }, { v: 18 },
    { v: 20 }, { v: 28 }, { v: 24 }, { v: 32 }, { v: 38 },
  ];

  // ==========================================
  // CÁLCULOS DINÂMICOS
  // ==========================================
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const receitasMes = data.transactions
    .filter((t) => t.type === 'receita' && isThisMonth(t.date))
    .reduce((acc, t) => acc + t.amount, 0);

  const despesasMes = data.transactions
    .filter((t) => t.type === 'despesa' && isThisMonth(t.date))
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoCorrente = data.transactions.reduce((acc, t) => {
    return t.type === 'receita' ? acc + t.amount : acc - t.amount;
  }, 0);

  const saldoCripto = data.cryptos.reduce((acc, c) => acc + (c.amount * c.unitPriceBrl), 0);
  const saldoGeral = saldoCorrente + saldoCripto;

  const pendingBills = data.bills.filter((b) => b.status !== 'pago');
  const billsTotal = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  const topCrypto = data.cryptos.length > 0 
    ? [...data.cryptos].sort((a, b) => (b.amount * b.unitPriceBrl) - (a.amount * a.unitPriceBrl))[0]
    : null;

  const cashFlowData = (receitasMes === 0 && despesasMes === 0) 
    ? [{ name: 'Vazio', value: 1, color: '#e2e8f0' }] 
    : [
        { name: 'Receitas', value: receitasMes, color: '#6366f1' },
        { name: 'Despesas', value: despesasMes, color: '#ec4899' },
      ];

  const savingsRate = receitasMes > 0 ? ((receitasMes - despesasMes) / receitasMes) * 100 : 0;
  
  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Título & Seletor de Período */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Visão Geral
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Resumo financeiro em tempo real</p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            id="home-period-select"
            className="appearance-none bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-xs font-bold text-indigo-900 dark:text-indigo-200 py-2 pl-3.5 pr-8 rounded-full shadow-xs focus:outline-none cursor-pointer"
          >
            <option value="Este Mês">Este Mês</option>
            <option value="Mês Passado">Mês Passado</option>
            <option value="Ano Atual">Ano Atual</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Card 1: Saldo Geral Consolidado */}
      <div
        onClick={onOpenRendimento}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-6 shadow-xl shadow-indigo-200/60 dark:shadow-none border border-indigo-500/30 cursor-pointer group transition-transform active:scale-[0.99]"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start mb-1">
          <span className="text-[11px] font-bold tracking-wider text-indigo-200 uppercase">
            Saldo Geral Consolidado
          </span>
          <span className="text-xs text-pink-100 bg-pink-500/30 border border-pink-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> Atualizado
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white my-3 tracking-tight">
          {formatCurrency(saldoGeral, data.settings.currency)}
        </div>

        <div className="pt-3 border-t border-indigo-500/40 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-indigo-200 font-medium">Conta Corrente</p>
            <p className="text-base font-bold text-white mt-0.5">
              {formatCurrency(saldoCorrente, data.settings.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-200 font-medium">Cripto (Convertido)</p>
            <p className="text-base font-bold text-white mt-0.5">
              {formatCurrency(saldoCripto, data.settings.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Insight Card */}
      {savingsRate > 0 && (
        <div className="bg-orange-50 border border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 dark:bg-orange-900/40 rounded-xl text-orange-600 dark:text-orange-400 font-bold shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-xs text-orange-950 dark:text-orange-200 leading-snug">
              <strong>Insight:</strong> Você tem uma taxa de economia de {savingsRate.toFixed(1)}% este mês!
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-lg shrink-0">
            Super
          </span>
        </div>
      )}

      {/* Card 2: Portfólio Cripto Top Assets */}
      <div
        onClick={() => onNavigateTab('cripto')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 cursor-pointer hover:border-pink-500/40 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center text-pink-600 dark:text-pink-300 font-black text-sm shadow-xs">
              {topCrypto ? topCrypto.symbol.charAt(0) : '₿'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Portfólio Cripto
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Top Asset</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            {topCrypto ? `${topCrypto.amount} ${topCrypto.symbol}` : 'Nenhum ativo'}
          </span>
          {topCrypto && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              topCrypto.change24h >= 0 
                ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
                : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/60'
            }`}>
              {topCrypto.change24h >= 0 ? '↑' : '↓'} {topCrypto.change24h}% (24h)
            </span>
          )}
        </div>

        {/* Sparkline Graphic (Pink Stroke) */}
        <div className="h-12 w-full mt-2 opacity-50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cryptoSparklineData}>
              <Line type="monotone" dataKey="v" stroke="#ec4899" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card 3: Fluxo de Caixa (Mês) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Fluxo de Caixa (Mês)
          </h3>
          <button
            onClick={() => onNavigateTab('financeiro')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-pink-600 flex items-center gap-0.5 transition-colors"
          >
            Ver detalhes <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cashFlowData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={40}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {cashFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Receitas
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatCurrency(receitasMes, data.settings.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Despesas
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatCurrency(despesasMes, data.settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Contas da Semana */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Contas da Semana
            </h3>
          </div>
          <span className="text-[11px] font-bold text-pink-600 bg-pink-100 dark:bg-pink-950/80 dark:text-pink-300 px-2.5 py-0.5 rounded-full">
            {pendingBills.length} pendente(s)
          </span>
        </div>

        <div className="mb-3">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(billsTotal, data.settings.currency)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
            total
          </span>
        </div>

        <div className="space-y-2">
          {pendingBills.length === 0 ? (
            <div className="text-center py-4 text-xs font-semibold text-slate-500">
              Nenhuma conta pendente!
            </div>
          ) : (
            pendingBills.slice(0, 2).map((bill) => (
              <div
                key={bill.id}
                onClick={() => onNavigateTab('contas')}
                className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-100 dark:bg-pink-950/60 rounded-xl text-pink-600 dark:text-pink-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{bill.title}</p>
                    <p className="text-[11px] font-semibold text-pink-600 dark:text-pink-400">
                      {bill.dueDate}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formatCurrency(bill.amount, data.settings.currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
