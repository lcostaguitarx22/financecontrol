import React from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowDownRight, ArrowUpRight, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export type CalendarEvent = {
  id: string;
  title: string;
  amount: number;
  type: 'renda' | 'debito';
  source: 'transacao' | 'conta' | 'conta_fixa' | 'salario';
  status?: string;
};

interface DayDetailsModalProps {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
  onClose: () => void;
  currency: string;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ date, events, onClose, currency }) => {
  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const getEventStyle = (evt: CalendarEvent) => {
    if (evt.source === 'conta_fixa' || evt.source === 'salario') {
      return {
        bg: 'bg-amber-50/50 dark:bg-amber-950/20',
        border: 'border-amber-100 dark:border-amber-900/30',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconText: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-600 dark:text-amber-400'
      };
    }
    if (evt.status === 'pendente' || evt.status === 'atrasado') {
      return {
        bg: 'bg-rose-50/50 dark:bg-rose-950/20',
        border: 'border-rose-100 dark:border-rose-900/30',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        iconText: 'text-rose-600 dark:text-rose-400',
        text: 'text-rose-600 dark:text-rose-400'
      };
    }
    return {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400'
    };
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white capitalize">
              {formattedDate}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Detalhes do dia</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 font-medium text-sm">Nenhum evento registrado para este dia.</p>
            </div>
          ) : (
            events.map((evt, idx) => {
              const style = getEventStyle(evt);
              return (
                <div 
                  key={idx} 
                  className={`p-3 rounded-2xl border flex items-center justify-between ${style.bg} ${style.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${style.iconBg} ${style.iconText}`}>
                      {evt.type === 'renda' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {evt.title}
                        {evt.status === 'pago' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                        {evt.source === 'conta' ? 'Conta a Pagar' :
                         evt.source === 'conta_fixa' ? 'Conta Fixa' :
                         evt.source === 'salario' ? 'Salário Previsto' : 'Transação'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-sm ${style.text}`}>
                      {evt.type === 'renda' ? '+' : '-'}{formatCurrency(evt.amount, currency)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Entradas</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(events.filter(e => e.type === 'renda').reduce((a, b) => a + b.amount, 0), currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Saídas</p>
            <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
              {formatCurrency(events.filter(e => e.type === 'debito').reduce((a, b) => a + b.amount, 0), currency)}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
