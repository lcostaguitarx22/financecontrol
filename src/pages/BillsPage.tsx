/**
 * @file BillsPage.tsx
 * @description Tela Contas a Pagar dinâmica.
 */

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Check,
  CreditCard,
  Wifi,
  Zap,
  Droplet,
  Home,
  Sparkles,
  Clock,
  Trash2,
  FileText,
  Edit2
} from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';
import { toggleBillPaid, deleteBill } from '../services/storage';
import { NewBillModal } from '../components/modals/NewBillModal';
import { DayDetailsModal, CalendarEvent } from '../components/modals/DayDetailsModal';

export const BillsPage: React.FC = () => {
  const { data } = useAppData();
  const [filter, setFilter] = useState<'Todas' | 'Pendentes'>('Todas');
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  // Calendário
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

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

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

    // Contas fixas (dueDate pode ser YYYY-MM-DD)
    data.fixedBills.forEach(b => {
      if (b.dueDate && b.dueDate.split('-')[2] === dayStr) {
        events.push({ id: b.id, title: b.title, amount: b.amount, type: 'debito', source: 'conta_fixa' });
      }
    });

    // Transações
    data.transactions.forEach(t => {
      if (t.date === dateStr) {
        events.push({ id: t.id, title: t.description, amount: t.amount, type: t.type === 'receita' ? 'renda' : 'debito', source: 'transacao' });
      }
    });

    // Salário (apenas no paymentDay)
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

  // Totais reais calculados com base em data.bills
  const totalBills = data.bills.reduce((acc, b) => acc + b.amount, 0);
  const totalPending = data.bills
    .filter((b) => b.status !== 'pago')
    .reduce((acc, b) => acc + b.amount, 0);
  const totalPaid = data.bills
    .filter((b) => b.status === 'pago')
    .reduce((acc, b) => acc + b.amount, 0);

  // Lista filtrada
  const filteredBills = data.bills.filter((b) => {
    if (filter === 'Pendentes') return b.status !== 'pago';
    return true;
  });

  const getBillIcon = (iconName?: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'Wifi':
        return <Wifi className="w-4 h-4 text-amber-600" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'Droplet':
        return <Droplet className="w-4 h-4 text-emerald-600" />;
      default:
        return <Home className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'pago') {
      return (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md">
          PAGO
        </span>
      );
    }
    if (status === 'atrasado') {
      return (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 px-2 py-0.5 rounded-md">
          ATRASADO
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded-md">
        PENDENTE
      </span>
    );
  };

  const pendingBills = data.bills.filter(b => b.status !== 'pago');
  const nextBill = pendingBills.length > 0 ? [...pendingBills].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] : null;

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Contas a Pagar
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gerencie seus compromissos financeiros
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowCalendarView(!showCalendarView)}
          id="bills-calendar-btn"
          className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-50/50 shadow-xs transition-colors"
        >
          <Calendar className="w-4 h-4 text-indigo-600" /> Calendário
        </button>
        <button
          onClick={() => setShowNewBillModal(true)}
          id="bills-new-account-btn"
          className="py-2.5 px-3 bg-indigo-600 dark:bg-indigo-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {showCalendarView && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-slate-900 dark:text-white">Visão Calendário</p>
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
                  className={`py-1.5 rounded-lg text-xs cursor-pointer flex flex-col items-center justify-center transition-all ${
                    isToday 
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
      )}

      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-indigo-100/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">
              Total Cadastrado
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(totalBills, data.settings.currency)}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-indigo-100/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider mb-1">
              Pendente
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(totalPending, data.settings.currency)}
            </p>
          </div>
          <div className="p-3 bg-pink-50 dark:bg-pink-950/60 rounded-2xl text-pink-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-indigo-100/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
              Pago
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalPaid, data.settings.currency)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {nextBill && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-xl shadow-indigo-200/50 dark:shadow-none border border-indigo-800/50 relative overflow-hidden">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h4 className="font-bold text-xs tracking-wider uppercase text-pink-300">
              Próxima Conta
            </h4>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed mb-4 font-medium">
            Lembre-se do pagamento de <strong className="text-white">{nextBill.title}</strong> programado para {nextBill.dueDate}.
          </p>
          <button
            onClick={() => toggleBillPaid(nextBill.id)}
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-pink-500/30"
          >
            Marcar como Pago
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Lista de Contas
          </h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('Todas')}
              className={`px-3 py-1 rounded-lg transition-all ${filter === 'Todas'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
                }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('Pendentes')}
              className={`px-3 py-1 rounded-lg transition-all ${filter === 'Pendentes'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
                }`}
            >
              Pendentes
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredBills.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">Nenhuma conta cadastrada.</p>
          ) : (
            filteredBills.map((bill) => (
              <div
                key={bill.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${bill.status === 'pago'
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800">
                    {getBillIcon(bill.iconName)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      {bill.title}
                      <span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                        <button
                          onClick={() => {
                            (window as any).currentEditBill = bill;
                            setShowNewBillModal(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteBill(bill.id)} className="text-slate-400 hover:text-pink-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusBadge(bill.status, bill.dueDate)}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {bill.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(bill.amount, data.settings.currency)}
                  </span>
                  <button
                    onClick={() => toggleBillPaid(bill.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${bill.status === 'pago'
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                  >
                    {bill.status === 'pago' && <Check className="w-4 h-4 stroke-[3px]" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">
          Próximas Contas
        </h3>

        <div className="space-y-4 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800">
          {pendingBills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum vencimento próximo.</p>
          ) : (
            [...pendingBills].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4).map(b => (
              <div key={b.id} className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-900 dark:bg-white rounded-full" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">{b.dueDate}</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {b.title} ({formatCurrency(b.amount, data.settings.currency)})
                </p>
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
      {showNewBillModal && <NewBillModal onClose={() => setShowNewBillModal(false)} />}
    </div>
  );
};
