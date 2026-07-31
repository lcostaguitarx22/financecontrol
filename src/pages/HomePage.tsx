/**
 * @file HomePage.tsx
 * @description Tela Visão Geral (Home) com calendário, próximas contas, transações, orçamento previsto e cripto.
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
  Clock,
  Activity,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency, formatDateBr } from '../utils/formatters';
import { TabType } from '../types';
import { DayDetailsModal, CalendarEvent } from '../components/modals/DayDetailsModal';
import { toggleBillPaid } from '../services/storage';

interface HomePageProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenRendimento?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateTab, onOpenRendimento }) => {
  const { data, livePrices } = useAppData();
  const [period, setPeriod] = useState('Este Mês');

  // ==========================================
  // CÁLCULOS GERAIS
  // ==========================================
  const currentMonthIdx = new Date().getMonth();
  const currentYearIdx = new Date().getFullYear();

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYearIdx;
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

  const saldoCripto = data.cryptos.reduce((acc, c) => {
    const livePrice = livePrices?.cryptos[c.symbol.toUpperCase()]?.brl || c.unitPriceBrl;
    return acc + (c.amount * livePrice);
  }, 0);

  const faturaCartao = data.bills
    .filter((b) => b.paymentMethod === 'cartao' && b.status !== 'pago')
    .reduce((acc, b) => acc + b.amount, 0);

  const saldoGeral = saldoCorrente + saldoCripto;

  const pendingBills = data.bills.filter((b) => b.status !== 'pago');
  const billsTotal = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  const cashFlowData = (receitasMes === 0 && despesasMes === 0)
    ? [{ name: 'Vazio', value: 1, color: '#e2e8f0' }]
    : [
      { name: 'Receitas', value: receitasMes, color: '#6366f1' },
      { name: 'Despesas', value: despesasMes, color: '#ec4899' },
    ];

  const savingsRate = receitasMes > 0 ? ((receitasMes - despesasMes) / receitasMes) * 100 : 0;

  // ==========================================
  // 1. CALENDÁRIO
  // ==========================================
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const paymentDay = Math.min(30, daysInMonth);
  const currentYyyyMm = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = monthsNames[currentMonth];

  const [selectedDay, setSelectedDay] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  const handlePrevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayStr = String(day).padStart(2, '0');

    // Contas a pagar
    data.bills.forEach(b => {
      if (b.dueDate === dateStr) {
        events.push({ id: b.id, title: b.title, amount: b.amount, type: 'debito', source: 'conta', status: b.status });
      }
    });

    // Contas fixas (evitando duplicação)
    (data.fixedBills || []).forEach(b => {
      const bRecurrence = b.recurrence || 'mensal';
      const bMonthKey = b.dueDate ? b.dueDate.substring(0, 7) : '';

      let shouldShow = true;
      if (bMonthKey) {
        if (bRecurrence === 'unico') {
          shouldShow = bMonthKey === currentYyyyMm;
        } else {
          shouldShow = bMonthKey <= currentYyyyMm;
        }
      }

      if (shouldShow && b.dueDate && b.dueDate.split('-')[2] === dayStr) {
        const alreadyGenerated = data.bills.some(realBill => realBill.fixedBillId === b.id && realBill.dueDate.startsWith(currentYyyyMm));
        if (!alreadyGenerated) {
          events.push({ id: b.id, title: b.title, amount: b.amount, type: 'debito', source: 'conta_fixa' });
        }
      }
    });

    // Transações
    data.transactions.forEach(t => {
      if (t.date === dateStr) {
        events.push({ id: t.id, title: t.description, amount: t.amount, type: t.type === 'receita' ? 'renda' : 'debito', source: 'transacao' });
      }
    });

    // Salário
    if (day === paymentDay) {
      const sal = data.monthlySalaries?.[currentYyyyMm] ?? data.salary;
      if (sal && sal > 0) {
        events.push({ id: 'salary-' + currentYyyyMm, title: 'Salário Mensal Fixo', amount: sal, type: 'renda', source: 'salario' });
      }
    }

    return events;
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = getEventsForDay(day);
    setSelectedDay({ date: dateStr, events });
  };

  // Helper to convert DD/MM/YYYY to YYYY-MM-DD for correct comparison
  const parseDateToComparable = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  // ==========================================
  // 3. PRÓXIMAS CONTAS (Até 8)
  // ==========================================
  const upcomingBills = pendingBills
    .sort((a, b) => parseDateToComparable(a.dueDate).localeCompare(parseDateToComparable(b.dueDate)))
    .slice(0, 8);

  const todayStr = new Date().toISOString().split('T')[0];
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const twoDaysStr = twoDaysFromNow.toISOString().split('T')[0];
  
  const urgentBills = upcomingBills.filter(b => parseDateToComparable(b.dueDate) <= twoDaysStr);
  const nextUrgentBill = urgentBills.length > 0 ? urgentBills[0] : null;

  // ==========================================
  // 4. ORÇAMENTO PREVISTO (MÊS SEGUINTE)
  // ==========================================
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonthIndex = nextMonthDate.getMonth();
  const nextMonthYyyyMm = `${nextMonthYear}-${String(nextMonthIndex + 1).padStart(2, '0')}`;

  const expectedSalaryNextMonth = data.monthlySalaries?.[nextMonthYyyyMm] ?? data.salary ?? 0;
  const expectedExtrasNextMonth = data.monthlyExtras?.[nextMonthYyyyMm] ?? 0;
  const totalRendaProx = expectedSalaryNextMonth + expectedExtrasNextMonth;

  const projectedFixedBills = (data.fixedBills || []).reduce((acc, b) => {
    const bRecurrence = b.recurrence || 'mensal';
    const bMonthKey = b.dueDate ? b.dueDate.substring(0, 7) : '';
    let shouldShow = true;
    if (bMonthKey) {
      if (bRecurrence === 'unico') {
        shouldShow = bMonthKey === nextMonthYyyyMm;
      } else {
        shouldShow = bMonthKey <= nextMonthYyyyMm;
      }
    }
    return acc + (shouldShow ? b.amount : 0);
  }, 0);

  const budgetRestanteProx = totalRendaProx - projectedFixedBills;
  const mesSeguinteNome = monthsNames[nextMonthIndex];

  // ==========================================
  // 5. TRANSAÇÕES RECENTES (Até 8)
  // ==========================================
  const recentTransactions = data.transactions.slice(0, 8);

  // ==========================================
  // 6. VARIAÇÃO DE CRIPTO
  // ==========================================
  const getLivePriceBrl = (c: any) => livePrices?.cryptos[c.symbol.toUpperCase()]?.brl || c.unitPriceBrl;
  const sortedCryptos = [...data.cryptos].sort((a, b) => (b.amount * getLivePriceBrl(b)) - (a.amount * getLivePriceBrl(a)));


  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">

      {/* Header Info */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Visão Geral
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tudo em um só lugar</p>
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

      {nextUrgentBill && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-xl shadow-indigo-200/50 dark:shadow-none border border-indigo-800/50 relative overflow-hidden">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h4 className="font-bold text-xs tracking-wider uppercase text-pink-300">
              Próxima Conta
            </h4>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed mb-4 font-medium">
            Lembre-se do pagamento de <strong className="text-white">{nextUrgentBill.title}</strong> programado para {formatDateBr(nextUrgentBill.dueDate)}.
          </p>
          <button
            onClick={() => toggleBillPaid(nextUrgentBill.id)}
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-pink-500/30"
          >
            Marcar como Pago
          </button>
        </div>
      )}

      {/* 2. SALDO GERAL & FLUXO DE CAIXA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Saldo Geral Consolidado */}
        <div
          onClick={onOpenRendimento}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-6 shadow-xl shadow-indigo-200/60 dark:shadow-none border border-indigo-500/30 cursor-pointer group transition-transform active:scale-[0.99]"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-bold tracking-wider text-indigo-200 uppercase">
              Saldo Consolidado
            </span>
            <span className="text-[10px] text-pink-100 bg-pink-500/30 border border-pink-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> Atualizado
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white my-3 tracking-tight">
            {formatCurrency(saldoGeral, data.settings.currency)}
          </div>
          <div className="pt-3 border-t border-indigo-500/40 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-indigo-200 font-medium">Conta Corrente</p>
              <p className="text-xs font-bold text-white mt-0.5">{formatCurrency(saldoCorrente, data.settings.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-indigo-200 font-medium">Cripto</p>
              <p className="text-xs font-bold text-white mt-0.5">{formatCurrency(saldoCripto, data.settings.currency)}</p>
            </div>
          </div>
        </div>

        {/* Card: Fluxo de Caixa (Mês) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cashFlowData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
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
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Receitas</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(receitasMes, data.settings.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Despesas</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(despesasMes, data.settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>

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
        </div>
      )}



      {/* 1. VISÃO CALENDÁRIO */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100/80 dark:border-slate-800 shadow-sm text-xs space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <p className="font-bold text-slate-900 dark:text-white">Calendário Financeiro</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold">&lt;</button>
            <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[80px] text-center">{monthName} {currentYear}</span>
            <button onClick={handleNextMonth} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold">&gt;</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-400 text-[10px]">
          <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-medium">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="py-1.5" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const events = getEventsForDay(day);
            const hasDebito = events.some(e => e.type === 'debito');
            const hasRenda = events.some(e => e.type === 'renda');

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`py-1.5 rounded-lg text-xs cursor-pointer flex flex-col items-center justify-center transition-all ${isToday
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <span>{day}</span>
                <div className="flex items-center gap-0.5 mt-0.5 h-1">
                  {hasRenda && <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`} />}
                  {hasDebito && <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-pink-300' : 'bg-rose-500'}`} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* 3. PRÓXIMAS CONTAS (Até 8) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Próximas Contas</h3>
          </div>
          <button onClick={() => onNavigateTab('contas')} className="text-xs font-bold text-indigo-600 hover:text-pink-600 flex items-center gap-0.5">
            Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2">
          {upcomingBills.length === 0 ? (
            <div className="text-center py-4 text-xs font-medium text-slate-400">Nenhuma conta pendente!</div>
          ) : (
            upcomingBills.map(bill => (
              <div key={bill.id} onClick={() => onNavigateTab('contas')} className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-pink-500 shadow-xs border border-slate-100 dark:border-slate-800">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{bill.title}</p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{formatDateBr(bill.dueDate)}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(bill.amount, data.settings.currency)}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {/* 5. TRANSAÇÕES RECENTES (Até 8) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Transações Recentes</h3>
          </div>
          <button onClick={() => onNavigateTab('financeiro')} className="text-xs font-bold text-indigo-600 hover:text-pink-600 flex items-center gap-0.5">
            Histórico <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-4 text-xs font-medium text-slate-400">Nenhuma transação recente!</div>
          ) : (
            recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'receita' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' : 'bg-pink-100 dark:bg-pink-950/50 text-pink-600'}`}>
                    {tx.type === 'receita' ? <ArrowUpFromLine className="w-3.5 h-3.5" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{tx.description}</p>
                    <p className="text-[10px] text-slate-500">{formatDateBr(tx.date)}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {tx.type === 'receita' ? '+' : '-'}{formatCurrency(tx.amount, data.settings.currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. ORÇAMENTO PREVISTO (Próximo Mês) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 shadow-sm text-white">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm">Orçamento Previsto ({mesSeguinteNome})</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Renda Esperada</p>
            <p className="text-sm font-bold text-white mt-1">{formatCurrency(totalRendaProx, data.settings.currency)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Contas Fixas</p>
            <p className="text-sm font-bold text-pink-300 mt-1">{formatCurrency(projectedFixedBills, data.settings.currency)}</p>
          </div>
          <div className="col-span-2 md:col-span-1 border-t border-slate-700 md:border-none pt-3 md:pt-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Saldo Livre</p>
            <p className={`text-sm font-bold mt-1 ${budgetRestanteProx >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(budgetRestanteProx, data.settings.currency)}
            </p>
          </div>
        </div>
      </div>



      {/* 6. VARIAÇÃO DE CRIPTO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Variações Cripto</h3>
          <button onClick={() => onNavigateTab('cripto')} className="text-xs font-bold text-indigo-600 hover:text-pink-600">
            Ir para Cripto <ArrowUpRight className="w-3.5 h-3.5 inline" />
          </button>
        </div>
        <div className="space-y-3">
          {sortedCryptos.length === 0 ? (
            <div className="text-center py-4 text-xs font-medium text-slate-400">Nenhum ativo cadastrado.</div>
          ) : (
            sortedCryptos.map(crypto => (
              <div key={crypto.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                    {crypto.symbol}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{crypto.name}</p>
                    <p className="text-[10px] text-slate-500">Saldo: {crypto.amount} {crypto.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(crypto.amount * getLivePriceBrl(crypto), data.settings.currency)}</p>
                  <p className={`text-[10px] font-bold ${crypto.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedDay && (
        <DayDetailsModal
          date={selectedDay.date}
          events={selectedDay.events}
          currency={data.settings.currency}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
};
