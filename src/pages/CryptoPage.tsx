import React, { useState } from 'react';
import { Plus, HardDrive, Building2, Flame, RefreshCcw, DollarSign, Wallet, Edit2, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';
import { Currency } from '../types';
import { NewCryptoModal } from '../components/modals/NewCryptoModal';
import { CryptoWalletModal } from '../components/modals/CryptoWalletModal';
import { deleteWallet } from '../services/storage';

export const CryptoPage: React.FC = () => {
  const { data, livePrices } = useAppData();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(data.settings.currency || 'BRL');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1W');
  const [showAddCryptoModal, setShowAddCryptoModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Helper para obter preço ao vivo (fallback para o valor salvo)
  const getLivePrice = (asset: any) => {
    const symbol = asset.symbol.toUpperCase();
    if (selectedCurrency === 'BRL') {
      return livePrices?.cryptos[symbol]?.brl || asset.unitPriceBrl;
    } else {
      const usdFallback = asset.unitPriceBrl / (livePrices?.usdToBrl || 5);
      return livePrices?.cryptos[symbol]?.usd || usdFallback;
    }
  };

  const totalValue = data.cryptos.reduce(
    (acc, c) => acc + c.amount * getLivePrice(c),
    0
  );

  const chartData = totalValue > 0 ? [
    { t: 'Ontem', v: totalValue * 0.95 },
    { t: 'Hoje', v: totalValue },
  ] : [
    { t: 'Ontem', v: 0 },
    { t: 'Hoje', v: 0 },
  ];

  // Organizar criptos por carteira
  const cryptosByWallet = data.wallets.map(wallet => {
    const cryptos = data.cryptos.filter(c => c.walletId === wallet.id);
    const walletTotal = cryptos.reduce((acc, c) => acc + (c.amount * getLivePrice(c)), 0);
    return { wallet, cryptos, walletTotal };
  });

  const unassignedCryptos = data.cryptos.filter(c => !c.walletId);
  const unassignedTotal = unassignedCryptos.reduce((acc, c) => acc + (c.amount * getLivePrice(c)), 0);

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Portfólio Cripto
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Visão geral e desempenho dos seus ativos digitais.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-xs">
          <button
            onClick={() => setSelectedCurrency('BRL')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              selectedCurrency === 'BRL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            BRL
          </button>
          <button
            onClick={() => setSelectedCurrency('USD')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              selectedCurrency === 'USD'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            USD
          </button>
        </div>

        {livePrices?.usdToBrl && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/50">
            <DollarSign className="w-3.5 h-3.5" />
            R$ {livePrices.usdToBrl.toFixed(2)}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <RefreshCcw className="w-24 h-24 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            Saldo Total {livePrices ? '(Ao Vivo)' : ''}
            {livePrices && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
          </p>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white my-2 tracking-tight">
            {formatCurrency(totalValue, selectedCurrency)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Evolução do Portfólio
          </h3>
        </div>
        <div className="h-40 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis hide domain={['dataMin', 'dataMax + 100']} />
              <Tooltip
                formatter={(val: number) => [formatCurrency(val, selectedCurrency), 'Saldo']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '16px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          Carteiras e Posições
        </h3>
        <button
          onClick={() => setShowWalletModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Carteira
        </button>
      </div>

      {data.wallets.length === 0 && unassignedCryptos.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-indigo-100/80 dark:border-slate-800 shadow-sm">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Nenhuma carteira configurada</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Crie sua primeira carteira para organizar seus criptoativos.</p>
        </div>
      )}

      {/* Renderizar cada carteira como um bloco */}
      {cryptosByWallet.map(({ wallet, cryptos, walletTotal }) => (
        <div key={wallet.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 mb-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                {wallet.iconType === 'hardware' && <HardDrive className="w-4 h-4" />}
                {wallet.iconType === 'exchange' && <Building2 className="w-4 h-4" />}
                {wallet.iconType === 'hot' && <Flame className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{wallet.name}</h4>
                  <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                    {wallet.type}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {formatCurrency(walletTotal, selectedCurrency)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  // @ts-ignore
                  window.currentEditWallet = wallet;
                  setShowWalletModal(true);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Editar Carteira"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={async () => {
                  if (confirm(`Deseja mesmo excluir a carteira ${wallet.name}? As moedas nela ficarão "Sem carteira".`)) {
                    await deleteWallet(wallet.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                title="Excluir Carteira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {cryptos.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">Nenhuma moeda nesta carteira.</p>
          ) : (
            <div className="space-y-1">
              {cryptos.map(asset => {
                const symbol = asset.symbol.toUpperCase();
                const livePriceBrl = livePrices?.cryptos[symbol]?.brl || asset.unitPriceBrl;
                const livePriceUsd = livePrices?.cryptos[symbol]?.usd || (asset.unitPriceBrl / (livePrices?.usdToBrl || 5));
                
                const totalBrl = asset.amount * livePriceBrl;
                const totalUsd = asset.amount * livePriceUsd;
                const isLive = !!livePrices?.cryptos[symbol];

                return (
                  <div key={asset.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                        style={{ backgroundColor: asset.color || '#3b82f6' }}
                      >
                        {asset.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {asset.name}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          {asset.symbol} {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Preço ao vivo"></span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 dark:text-white leading-none">
                          {formatCurrency(selectedCurrency === 'BRL' ? totalBrl : totalUsd, selectedCurrency)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          {asset.amount} {asset.symbol}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            // @ts-ignore
                            window.currentEditCrypto = asset;
                            setShowAddCryptoModal(true);
                          }}
                          className="p-1.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded hover:bg-indigo-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Deseja mesmo excluir ${asset.name}?`)) {
                              const { deleteCryptoAsset } = await import('../services/storage');
                              await deleteCryptoAsset(asset.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Renderizar moedas sem carteira (legado ou desvinculadas) */}
      {unassignedCryptos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 border-dashed mb-4 opacity-80">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Outros Ativos (Sem Carteira)</h4>
              <p className="text-sm font-extrabold text-slate-600 dark:text-slate-400 mt-0.5">
                {formatCurrency(unassignedTotal, selectedCurrency)}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {unassignedCryptos.map(asset => {
              const symbol = asset.symbol.toUpperCase();
              const livePriceBrl = livePrices?.cryptos[symbol]?.brl || asset.unitPriceBrl;
              const livePriceUsd = livePrices?.cryptos[symbol]?.usd || (asset.unitPriceBrl / (livePrices?.usdToBrl || 5));
              
              const totalBrl = asset.amount * livePriceBrl;
              const totalUsd = asset.amount * livePriceUsd;

              return (
                <div key={asset.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: asset.color || '#3b82f6' }}
                    >
                      {asset.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {asset.name}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-500">
                        {asset.symbol}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 dark:text-white leading-none">
                        {formatCurrency(selectedCurrency === 'BRL' ? totalBrl : totalUsd, selectedCurrency)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        {asset.amount} {asset.symbol}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          // @ts-ignore
                          window.currentEditCrypto = asset;
                          setShowAddCryptoModal(true);
                        }}
                        className="p-1.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded hover:bg-indigo-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Deseja mesmo excluir ${asset.name}?`)) {
                            const { deleteCryptoAsset } = await import('../services/storage');
                            await deleteCryptoAsset(asset.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAddCryptoModal(true)}
        className="fixed bottom-20 right-5 z-30 w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-300 dark:shadow-none flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="Adicionar Criptoativo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAddCryptoModal && <NewCryptoModal onClose={() => setShowAddCryptoModal(false)} />}
      {showWalletModal && <CryptoWalletModal onClose={() => setShowWalletModal(false)} />}
    </div>
  );
};
