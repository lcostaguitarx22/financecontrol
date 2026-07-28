/**
 * @file NotificationModal.tsx
 * @description Modal de alertas e notificações financeiras.
 */

import React from 'react';
import { X, AlertTriangle, Bell, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';

interface NotificationModalProps {
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose }) => {
  const { data } = useAppData();

  const overdueBills = data.bills.filter((b) => b.status === 'atrasado');
  const pendingTodayBills = data.bills.filter((b) => b.status === 'pendente' && b.dueDate.includes('hoje'));
  const highBudgets = data.budgets.filter((bg) => bg.usedPercentage >= 80);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Notificações e Alertas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Atualizado recentemente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="notification-modal-close"
            className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {overdueBills.map((bill) => (
            <div
              key={bill.id}
              className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-rose-900 dark:text-rose-200">Conta em Atraso</p>
                <p className="text-rose-700 dark:text-rose-300 text-xs">
                  {bill.title} ({formatCurrency(bill.amount, data.settings.currency)}) venceu ontem.
                </p>
              </div>
            </div>
          ))}

          {pendingTodayBills.map((bill) => (
            <div
              key={bill.id}
              className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-start gap-3"
            >
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-200">Vencimento Hoje</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs">
                  {bill.title} no valor de {formatCurrency(bill.amount, data.settings.currency)}.
                </p>
              </div>
            </div>
          ))}

          {highBudgets.map((bg) => (
            <div
              key={bg.id}
              className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-200">Limite de Orçamento</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Você já consumiu {bg.usedPercentage}% do orçamento planejado para {bg.name}.
                </p>
              </div>
            </div>
          ))}

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">Cripto +5.2% em 24h</p>
              <p className="text-emerald-700 dark:text-emerald-300 text-xs">
                Seu portfólio cripto valorizou R$ 4.150,00 nas últimas 24 horas.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            id="notification-modal-ok"
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-xl hover:opacity-90 text-sm transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
