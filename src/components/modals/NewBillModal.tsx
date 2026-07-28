/**
 * @file NewBillModal.tsx
 * @description Modal para adicionar nova conta a pagar em Contas.
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { addBill } from '../../services/storage';

interface NewBillModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewBillModal: React.FC<NewBillModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('Vence hoje');
  const [category, setCategory] = useState('Utilidades');

  const categories = ['Cartão', 'Conectividade', 'Utilidades', 'Moradia', 'Outros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor preencha um título e valor válido.');
      return;
    }

    addBill({
      title,
      amount: parsedAmount,
      dueDate,
      status: 'pendente',
      category,
      iconName: 'CreditCard',
      isUrgent: dueDate.includes('hoje') || dueDate.includes('amanhã'),
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-indigo-50 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Nova Conta a Pagar</h3>
          <button
            onClick={onClose}
            id="new-bill-close"
            className="p-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Conta / Beneficiário
            </label>
            <input
              type="text"
              placeholder="Ex: Cartão Nubank, Aluguel, Luz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vencimento
              </label>
              <input
                type="text"
                placeholder="Ex: Vence hoje, 25 Nov"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            id="new-bill-submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" /> Cadastrar Conta
          </button>
        </form>
      </div>
    </div>
  );
};
