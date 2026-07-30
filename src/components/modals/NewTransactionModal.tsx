/**
 * @file NewTransactionModal.tsx
 * @description Modal para adicionar nova receita ou despesa no extrato.
 */

import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { addTransaction, getAppData, saveAppData } from '../../services/storage';
import { TransactionType } from '../../types';

interface NewTransactionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('despesa');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [categories, setCategories] = useState<string[]>([
    'Água', 'Assinaturas', 'Dízimo', 'Energia', 'Internet',
    'IPTU', 'IPVA', 'Streaming', 'Telefonia', 'Parcela de Carro',
    'Parcela Terreno', 'Outros'
  ]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  React.useEffect(() => {
    getAppData().then(data => {
      if (data.settings?.categories && data.settings.categories.length > 0) {
        setCategories(data.settings.categories);
      }
    });
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const data = await getAppData();
    const currentCats = data.settings?.categories || categories;
    if (!currentCats.includes(newCategoryName)) {
      currentCats.push(newCategoryName);
      data.settings.categories = currentCats;
      await saveAppData(data);
    }
    setCategories(currentCats);
    setCategory(newCategoryName);
    setIsAddingNew(false);
    setNewCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor preencha uma descrição e um valor válido.');
      return;
    }

    addTransaction({
      description,
      amount: parsedAmount,
      type,
      category,
      date,
      iconName: type === 'receita' ? 'TrendingUp' : 'ShoppingBag',
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-indigo-50 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Nova Transação</h3>
          <button
            onClick={onClose}
            id="new-tx-close"
            className="p-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Alternador Receita / Despesa */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-indigo-50/60 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('receita')}
              className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" /> Receita
            </button>
            <button
              type="button"
              onClick={() => setType('despesa')}
              className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                type === 'despesa'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Minus className="w-4 h-4" /> Despesa
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Salário, Uber"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <select
              value={isAddingNew ? '__NEW__' : category}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setIsAddingNew(true);
                  setCategory('');
                } else {
                  setIsAddingNew(false);
                  setCategory(e.target.value);
                }
              }}
              className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__NEW__">➕ Nova Categoria...</option>
            </select>
            
            {isAddingNew && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Adicionar
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            id="new-tx-submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" /> Salvar Transação
          </button>
        </form>
      </div>
    </div>
  );
};
