/**
 * @file BudgetLimitsModal.tsx
 * @description Modal para ajustar limites de orçamento por categoria.
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAppData } from '../../hooks/useAppData';
import { saveAppData } from '../../services/storage';

interface BudgetLimitsModalProps {
  onClose: () => void;
}

export const BudgetLimitsModal: React.FC<BudgetLimitsModalProps> = ({ onClose }) => {
  const { data } = useAppData();
  const [budgets, setBudgets] = useState(data.budgets);

  const handleAmountChange = (id: string, newAllocated: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, allocated: newAllocated } : b))
    );
  };

  const handleSave = () => {
    const updatedData = { ...data, budgets };
    saveAppData(updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-indigo-50 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Ajustar Limites de Orçamento</h3>
          <button
            onClick={onClose}
            id="budget-modal-close"
            className="p-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {budgets.map((bg) => (
            <div key={bg.id} className="p-3.5 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl border border-indigo-100/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{bg.name}</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{bg.usedPercentage}% consumido</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  value={bg.allocated}
                  onChange={(e) => handleAmountChange(bg.id, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-indigo-50 dark:border-slate-800">
          <button
            onClick={handleSave}
            id="budget-modal-save"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Salvar Novos Limites
          </button>
        </div>
      </div>
    </div>
  );
};
