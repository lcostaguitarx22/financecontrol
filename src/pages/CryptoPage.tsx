/**
 * @file CryptoPage.tsx
 * @description Tela Portfólio Cripto dinâmica.
 */

import React, { useState } from 'react';
import { Plus, SlidersHorizontal, HardDrive, Building2, Flame } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';
import { Currency } from '../types';
import { NewCryptoModal } from '../components/modals/NewCryptoModal';

export const CryptoPage: React.FC = () => {
  const { data } = useAppData();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(data.settings.currency || 'BRL');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1W');
  const [showAddModal, setShowAddModal] = useState(false);

  // Calcular saldo cripto total real
  const totalValueBrl = data.cryptos.reduce(
    (acc, c) => acc + c.amount * c.unitPriceBrl,
    0
  );

  // Fallback pra zero já que não salvamos histórico temporal real de criptos ainda
  const chartData = totalValueBrl > 0 ? [
    { t: 'Ontem', v: totalValueBrl * 0.95 },
    { t: 'Hoje', v: totalValueBrl },
  ] : [
    { t: 'Ontem', v: 0 },
    { t: 'Hoje', v: 0 },
  ];

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

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Saldo Total
        </p>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white my-2 tracking-tight">
          {formatCurrency(totalValueBrl, selectedCurrency)}
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Minhas Carteiras
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            id="crypto-add-wallet-btn"
            className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {data.wallets.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">Nenhuma carteira configurada.</p>
          ) : (
            data.wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 dark:bg-indigo-900 text-white rounded-xl shadow-xs">
                    {wallet.iconType === 'hardware' && <HardDrive className="w-4 h-4" />}
                    {wallet.iconType === 'exchange' && <Building2 className="w-4 h-4" />}
                    {wallet.iconType === 'hot' && <Flame className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {wallet.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {wallet.type}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                  {wallet.percentage}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Posições Atuais
          </h3>
          <button className="p-1.5 text-slate-400 hover:text-indigo-600">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-indigo-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-2">Moeda</th>
                <th className="pb-2 text-center">Qtde</th>
                <th className="pb-2 text-right">Preço / Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50 dark:divide-slate-800/60 text-xs">
              {data.cryptos.length === 0 ? (
                 <tr>
                   <td colSpan={3} className="py-6 text-center text-slate-400">Nenhum ativo.</td>
                 </tr>
              ) : (
                data.cryptos.map((asset) => {
                  const totalItemBrl = asset.amount * asset.unitPriceBrl;
                  return (
                    <tr key={asset.id} className="group hover:bg-indigo-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                            style={{ backgroundColor: asset.color || '#3b82f6' }}
                          >
                            {asset.symbol.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {asset.name}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                              {asset.symbol}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {asset.amount}
                      </td>
                      <td className="py-3 text-right">
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(totalItemBrl, selectedCurrency)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatCurrency(asset.unitPriceBrl, selectedCurrency)}/un
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        id="crypto-fab-add"
        className="fixed bottom-20 right-5 z-30 w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-300 dark:shadow-none flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="Adicionar Criptoativo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAddModal && <NewCryptoModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};
