/**
 * @file NewCryptoModal.tsx
 * @description Modal para adicionar novo ativo de criptomoeda no portfólio.
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Bitcoin, RefreshCw } from 'lucide-react';
import { addCryptoAsset, updateCryptoAsset } from '../../services/storage';
import { useAppData } from '../../hooks/useAppData';

interface NewCryptoModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_CRYPTOS = [
  { name: 'Bitcoin', symbol: 'BTC' },
  { name: 'Ethereum', symbol: 'ETH' },
  { name: 'Tether', symbol: 'USDT' },
  { name: 'BNB', symbol: 'BNB' },
  { name: 'Solana', symbol: 'SOL' },
  { name: 'XRP', symbol: 'XRP' },
  { name: 'USDC', symbol: 'USDC' },
  { name: 'Cardano', symbol: 'ADA' },
  { name: 'Avalanche', symbol: 'AVAX' },
  { name: 'Dogecoin', symbol: 'DOGE' },
  { name: 'Polkadot', symbol: 'DOT' },
  { name: 'Polygon', symbol: 'MATIC' },
  { name: 'Chainlink', symbol: 'LINK' },
];

export const NewCryptoModal: React.FC<NewCryptoModalProps> = ({ onClose, onSuccess }) => {
  const { livePrices } = useAppData();
  const editMode = !!(window as any).currentEditCrypto;
  const initialAsset = (window as any).currentEditCrypto;

  const [name, setName] = useState(initialAsset?.name || '');
  const [symbol, setSymbol] = useState(initialAsset?.symbol || '');
  const [amount, setAmount] = useState(initialAsset?.amount?.toString() || '');
  const [priceInput, setPriceInput] = useState(initialAsset?.unitPriceBrl?.toString() || '');
  const [inputCurrency, setInputCurrency] = useState<'BRL' | 'USD'>('BRL');

  useEffect(() => {
    return () => {
      // Cleanup do editMode ao fechar
      delete (window as any).currentEditCrypto;
    };
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const found = COMMON_CRYPTOS.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (found) setSymbol(found.symbol);
  };

  const handleSymbolChange = (val: string) => {
    setSymbol(val.toUpperCase());
    const found = COMMON_CRYPTOS.find(c => c.symbol.toUpperCase() === val.toUpperCase());
    if (found) setName(found.name);
  };

  const toggleCurrency = () => {
    if (!priceInput || isNaN(parseFloat(priceInput))) {
      setInputCurrency(prev => prev === 'BRL' ? 'USD' : 'BRL');
      return;
    }

    const currentVal = parseFloat(priceInput.replace(',', '.'));
    const usdToBrl = livePrices?.usdToBrl || 5.0;

    if (inputCurrency === 'BRL') {
      // Convert BRL to USD
      setPriceInput((currentVal / usdToBrl).toFixed(2));
      setInputCurrency('USD');
    } else {
      // Convert USD to BRL
      setPriceInput((currentVal * usdToBrl).toFixed(2));
      setInputCurrency('BRL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedPriceInput = parseFloat(priceInput.replace(',', '.'));

    if (!name || !symbol || isNaN(parsedAmount) || isNaN(parsedPriceInput)) {
      alert('Por favor preencha todos os campos com valores válidos.');
      return;
    }

    // Convert price to BRL for storage if it was inputted in USD
    const usdToBrl = livePrices?.usdToBrl || 5.0;
    const finalPriceBrl = inputCurrency === 'USD' ? parsedPriceInput * usdToBrl : parsedPriceInput;

    const payload = {
      name,
      symbol: symbol.toUpperCase(),
      amount: parsedAmount,
      unitPriceBrl: finalPriceBrl,
      change24h: initialAsset?.change24h || 0,
      color: initialAsset?.color || '#3b82f6',
    };

    if (editMode) {
      await updateCryptoAsset(initialAsset.id, payload);
    } else {
      await addCryptoAsset(payload);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {editMode ? 'Editar Criptoativo' : 'Adicionar Criptoativo'}
            </h3>
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
          <datalist id="crypto-names">
            {COMMON_CRYPTOS.map(c => <option key={c.name} value={c.name} />)}
          </datalist>
          <datalist id="crypto-symbols">
            {COMMON_CRYPTOS.map(c => <option key={c.symbol} value={c.symbol} />)}
          </datalist>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Nome do Ativo
              </label>
              <input
                type="text"
                list="crypto-names"
                placeholder="Ex: Solana"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
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
                list="crypto-symbols"
                placeholder="SOL"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
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
                step="0.00000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Preço ({inputCurrency === 'BRL' ? 'R$' : 'US$'})
                </label>
                <button
                  type="button"
                  onClick={toggleCurrency}
                  className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"
                >
                  <RefreshCw className="w-3 h-3" /> Mudar
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
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
            <Check className="w-4 h-4" /> {editMode ? 'Salvar Alterações' : 'Salvar Ativo no Portfólio'}
          </button>
        </form>
      </div>
    </div>
  );
};
