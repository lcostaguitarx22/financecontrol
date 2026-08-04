/**
 * @file NewRendimentoModal.tsx
 * @description Modal para adicionar nova entrada de rendimento no resumo acumulado.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, TrendingUp } from 'lucide-react';
import { addRendimento } from '../../services/storage';

interface NewRendimentoModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewRendimentoModal: React.FC<NewRendimentoModalProps> = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor digite um valor válido.');
      return;
    }

    addRendimento({
      amount: parsedAmount,
      date: dateStr,
      label: 'Hoje',
      variationPercentage: 3.5,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Nova Entrada de Rendimento</h3>
          </div>
          <button
            onClick={onClose}
            id="new-rendimento-close"
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Valor do Dia (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Data
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            id="new-rendimento-submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" /> Adicionar Rendimento
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
