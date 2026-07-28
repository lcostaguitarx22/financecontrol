/**
 * @file NewCryptoModal.tsx
 * @description Modal para adicionar novo ativo de criptomoeda no portfólio.
 */

import React, { useState } from 'react';
import { X, Check, Bitcoin } from 'lucide-react';
import { addCryptoAsset } from '../../services/storage';

interface NewCryptoModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewCryptoModal: React.FC<NewCryptoModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('Cardano');
  const [symbol, setSymbol] = useState('ADA');
  const [amount, setAmount] = useState('');
  const [unitPriceBrl, setUnitPriceBrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedPrice = parseFloat(unitPriceBrl.replace(',', '.'));

    if (!name || !symbol || isNaN(parsedAmount) || isNaN(parsedPrice)) {
      alert('Por favor preencha todos os campos com valores válidos.');
      return;
    }

    addCryptoAsset({
      name,
      symbol: symbol.toUpperCase(),
      amount: parsedAmount,
      unitPriceBrl: parsedPrice,
      change24h: 2.5,
      color: '#3b82f6',
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Adicionar Criptoativo</h3>
          </div>
          <button
            onClick={onClose}
            id="new-crypto-close"
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Nome do Ativo
              </label>
              <input
                type="text"
                placeholder="Ex: Solana, Polkadot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Símbolo
              </label>
              <input
                type="text"
                placeholder="SOL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-center"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                step="0.0001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={unitPriceBrl}
                onChange={(e) => setUnitPriceBrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            id="new-crypto-submit"
            className="w-full py-3 bg-slate-900 dark:bg-amber-600 hover:opacity-90 text-white font-medium rounded-xl text-sm transition-opacity flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" /> Salvar Ativo no Portfólio
          </button>
        </form>
      </div>
    </div>
  );
};
