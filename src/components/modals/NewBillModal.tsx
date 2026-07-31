/**
 * @file NewBillModal.tsx
 * @description Modal para adicionar nova conta a pagar em Contas.
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { addBill, addTransaction, getAppData, saveAppData } from '../../services/storage';

interface NewBillModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewBillModal: React.FC<NewBillModalProps> = ({ onClose, onSuccess }) => {
  const initialBill = (window as any).currentEditBill;
  const editMode = !!initialBill;

  const [title, setTitle] = useState(initialBill?.title || '');
  const [amount, setAmount] = useState(initialBill?.amount?.toString() || '');
  
  // Helper para converter DD/MM/YYYY para YYYY-MM-DD
  const parseDateToInput = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  // Define a data de hoje no formato YYYY-MM-DD
  const getTodayFormatted = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const [dueDate, setDueDate] = useState(editMode ? parseDateToInput(initialBill.dueDate) : getTodayFormatted());
  const [category, setCategory] = useState(initialBill?.category || 'Utilidades');
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'pix' | 'cartao'>(initialBill?.paymentMethod || 'saldo');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor preencha um título e valor válido.');
      return;
    }

    const today = getTodayFormatted();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const isUrgent = dueDate === today || dueDate === tomorrow || dueDate < today;

    // Status agora sempre inicia pendente (mesmo saldo/pix), para ser abatido pelo Auto-Payer
    const finalStatus = editMode ? initialBill.status : 'pendente';

    const billData = {
      title,
      amount: parsedAmount,
      dueDate: dueDate, 
      status: finalStatus as 'pendente' | 'pago',
      category,
      paymentMethod,
      iconName: paymentMethod === 'cartao' ? 'CreditCard' : 'FileText',
      isUrgent,
    };

    if (editMode) {
      const { updateBill } = await import('../../services/storage');
      await updateBill(initialBill.id, billData);
      (window as any).currentEditBill = null;
    } else {
      const { addBill } = await import('../../services/storage');
      await addBill(billData);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-indigo-50 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {editMode ? 'Editar Conta' : 'Nova Conta a Pagar'}
          </h3>
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
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Método de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'saldo' | 'pix' | 'cartao')}
              className="w-full px-4 py-3 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="saldo">Saldo em Conta</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão de Crédito</option>
            </select>
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
            id="new-bill-submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" /> {editMode ? 'Salvar Alterações' : 'Cadastrar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
};
