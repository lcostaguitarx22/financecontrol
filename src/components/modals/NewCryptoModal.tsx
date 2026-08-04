/**
 * @file NewCryptoModal.tsx
 * @description Modal para adicionar novo ativo de criptomoeda no portfólio.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Bitcoin, Loader2 } from 'lucide-react';
import { addCryptoAsset, updateCryptoAsset } from '../../services/storage';
import { useAppData } from '../../hooks/useAppData';
import { fetchCryptoPrices } from '../../services/api';

interface NewCryptoModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_CRYPTOS = [
  { name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { name: 'Tether USDt', symbol: 'USDT', icon: '₮' },
  { name: 'BNB', symbol: 'BNB', icon: 'BNB' },
  { name: 'Solana', symbol: 'SOL', icon: '◎' },
  { name: 'USDC', symbol: 'USDC', icon: '$' },
  { name: 'XRP', symbol: 'XRP', icon: '✕' },
  { name: 'TRON', symbol: 'TRX', icon: 'TRX' },
  { name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð' },
  { name: 'Cardano', symbol: 'ADA', icon: '₳' },
  { name: 'Avalanche', symbol: 'AVAX', icon: '🔺' },
  { name: 'Polkadot', symbol: 'DOT', icon: '●' },
  { name: 'Polygon', symbol: 'MATIC', icon: '🟣' },
  { name: 'Chainlink', symbol: 'LINK', icon: '🔗' },
];

export const NewCryptoModal: React.FC<NewCryptoModalProps> = ({ onClose, onSuccess }) => {
  const { data, livePrices } = useAppData();
  const editMode = !!(window as any).currentEditCrypto;
  const initialAsset = (window as any).currentEditCrypto;

  const [name, setName] = useState(initialAsset?.name || '');
  const [symbol, setSymbol] = useState(initialAsset?.symbol || '');
  const [amount, setAmount] = useState(initialAsset?.amount?.toString() || '');
  const [walletId, setWalletId] = useState(initialAsset?.walletId || '');
  
  // O preço será exibido/digitado em USD
  const initialUsdPrice = editMode 
    ? (livePrices?.cryptos[initialAsset.symbol.toUpperCase()]?.usd || (initialAsset.unitPriceBrl / (livePrices?.usdToBrl || 5)))
    : '';
  const [priceInputUsd, setPriceInputUsd] = useState(initialUsdPrice.toString());
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      delete (window as any).currentEditCrypto;
    };
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-fetch do preço ao vivo quando o símbolo muda (apenas se não estiver no editMode ou se trocar de moeda)
  useEffect(() => {
    let active = true;
    
    const fetchPrice = async () => {
      if (!symbol || symbol.length < 2) return;
      
      setIsFetchingPrice(true);
      try {
        const prices = await fetchCryptoPrices([symbol]);
        if (active && prices[symbol.toUpperCase()]) {
          setPriceInputUsd(prices[symbol.toUpperCase()].usd.toString());
        }
      } catch (err) {
        console.error('Falha ao buscar cotação', err);
      } finally {
        if (active) setIsFetchingPrice(false);
      }
    };

    const timer = setTimeout(fetchPrice, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [symbol]);

  const selectCrypto = (c: typeof COMMON_CRYPTOS[0]) => {
    setName(c.name);
    setSymbol(c.symbol);
    setIsDropdownOpen(false);
  };

  const filteredCryptos = COMMON_CRYPTOS.filter(c => 
    c.name.toLowerCase().includes(name.toLowerCase()) || 
    c.symbol.toLowerCase().includes(name.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedPriceUsd = parseFloat(priceInputUsd.replace(',', '.'));

    if (!name || !symbol || isNaN(parsedAmount) || isNaN(parsedPriceUsd)) {
      alert('Por favor preencha todos os campos com valores válidos.');
      return;
    }

    // Convertendo USD digitado/buscado para BRL para salvar no banco
    const usdToBrl = livePrices?.usdToBrl || 5.0;
    const finalPriceBrl = parsedPriceUsd * usdToBrl;

    const payload = {
      name,
      symbol: symbol.toUpperCase(),
      amount: parsedAmount,
      unitPriceBrl: finalPriceBrl,
      change24h: initialAsset?.change24h || 0,
      color: initialAsset?.color || '#3b82f6',
      walletId: walletId || undefined,
    };

    if (editMode) {
      await updateCryptoAsset(initialAsset.id, payload);
    } else {
      await addCryptoAsset(payload);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-visible flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
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

        <div className="overflow-y-auto p-5 shrink-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NOVO CAMPO: CARTEIRA */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Carteira Destino
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Selecione uma carteira</option>
                {data.wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nome do Ativo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bitcoin"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                
                {/* Custom Dropdown List */}
                {isDropdownOpen && filteredCryptos.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                    <ul className="py-1">
                      {filteredCryptos.map(c => (
                        <li 
                          key={c.symbol}
                          onClick={() => selectCrypto(c)}
                          className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-slate-700 rounded-full text-[10px] text-white">
                              {c.icon}
                            </span>
                            <span className="text-sm font-medium text-white">{c.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{c.symbol}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Símbolo
                </label>
                <input
                  type="text"
                  placeholder="BTC"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
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
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    Preço (US$) 
                    {isFetchingPrice && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
                  </label>
                  {!isFetchingPrice && symbol && priceInputUsd && (
                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950 px-1 rounded">Ao vivo</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  value={priceInputUsd}
                  onChange={(e) => setPriceInputUsd(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="new-crypto-submit"
              className="w-full py-3 bg-slate-900 dark:bg-amber-600 hover:opacity-90 text-white font-medium rounded-xl text-sm transition-opacity flex items-center justify-center gap-2 mt-4"
            >
              <Check className="w-4 h-4" /> {editMode ? 'Salvar Alterações' : 'Salvar Ativo no Portfólio'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
