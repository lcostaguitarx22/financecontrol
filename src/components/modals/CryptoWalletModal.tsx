/**
 * @file CryptoWalletModal.tsx
 * @description Modal para adicionar ou editar uma carteira de criptomoedas.
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Wallet } from 'lucide-react';
import { addWallet, updateWallet } from '../../services/storage';
import { Wallet as WalletType } from '../../types';

interface CryptoWalletModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const CryptoWalletModal: React.FC<CryptoWalletModalProps> = ({ onClose, onSuccess }) => {
  const editMode = !!(window as any).currentEditWallet;
  const initialWallet = (window as any).currentEditWallet as WalletType | undefined;

  const [name, setName] = useState(initialWallet?.name || '');
  const [type, setType] = useState(initialWallet?.type || 'Corretora');
  const [iconType, setIconType] = useState<'hardware' | 'exchange' | 'hot'>(initialWallet?.iconType || 'exchange');

  useEffect(() => {
    return () => {
      delete (window as any).currentEditWallet;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert('Por favor, informe o nome da carteira.');
      return;
    }

    const payload = {
      name,
      type,
      iconType,
      percentage: initialWallet?.percentage || 0, // Ignoramos percentage, será calculado depois
    };

    if (editMode && initialWallet) {
      await updateWallet(initialWallet.id, payload);
    } else {
      await addWallet(payload);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {editMode ? 'Editar Carteira' : 'Nova Carteira'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Nome da Carteira
            </label>
            <input
              type="text"
              placeholder="Ex: Binance, Ledger, MetaMask"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Subtítulo (Tipo)
              </label>
              <input
                type="text"
                placeholder="Ex: Exchange, Cold Wallet"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Ícone
              </label>
              <select
                value={iconType}
                onChange={(e) => setIconType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="exchange">Corretora (Prédio)</option>
                <option value="hardware">Hardware (Dispositivo)</option>
                <option value="hot">Hot Wallet (Fogo)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white font-medium rounded-xl text-sm transition-opacity flex items-center justify-center gap-2 mt-4"
          >
            <Check className="w-4 h-4" /> {editMode ? 'Salvar Alterações' : 'Adicionar Carteira'}
          </button>
        </form>
      </div>
    </div>
  );
};
