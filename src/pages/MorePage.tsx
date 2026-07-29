/**
 * @file MorePage.tsx
 * @description Tela Mais/Configurações com ajuste de moeda, temas, alertas, categorias e sincronização.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Moon,
  Sun,
  Laptop,
  Bell,
  Plus,
  RefreshCw,
  Utensils,
  Car,
  Home,
  TrendingUp,
  RotateCcw,
  Sparkles,
  LogOut,
  Lightbulb,
  GlassWaterIcon,
  Network
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppData } from '../hooks/useAppData';
import { updateSettings, resetToDemoData } from '../services/storage';
import { Currency, ThemeMode, AppData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MorePageProps {
  onOpenRendimento: () => void;
}

export const MorePage: React.FC<MorePageProps> = ({ onOpenRendimento }) => {
  const { data, setData } = useAppData();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleUpdateSettings = (partialSettings: Partial<AppData['settings']>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partialSettings }
    }));
  };

  const handleCurrencyChange = (curr: Currency) => {
    handleUpdateSettings({ currency: curr });
  };

  const handleThemeChange = (mode: ThemeMode) => {
    handleUpdateSettings({ theme: mode });
    // Aplicar classe dark no documentElement
    if (mode === 'escuro') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'claro') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      handleUpdateSettings({ lastSync: `Hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` });
      setIsSyncing(false);
    }, 1200);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Título */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Configurações & Mais
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Personalize preferências do aplicativo e gerencie seus dados
        </p>
      </div>

      {/* Banner para Acesso Rápido ao Resumo de Rendimentos */}
      <div
        onClick={onOpenRendimento}
        className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-pink-600 text-white rounded-3xl p-5 shadow-xl shadow-indigo-200/50 dark:shadow-none flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Resumo de Rendimentos</h3>
            <p className="text-xs text-indigo-100 font-medium">Montante Acumulado {formatCurrency(data.totalAccumulatedYield, data.settings.currency)}</p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-pink-300 animate-pulse" />
      </div>

      {/* Card 1: Preferências */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Preferências
          </h3>
        </div>

        {/* Moeda Padrão */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Moeda Padrão</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Selecione a moeda principal da sua carteira.
            </p>
          </div>
          <select
            value={data.settings.currency}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
            id="more-currency-select"
            className="px-3.5 py-2 bg-indigo-50/60 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-indigo-900 dark:text-indigo-200 focus:outline-none cursor-pointer"
          >
            <option value="BRL">BRL (R$)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

        <hr className="border-indigo-50 dark:border-slate-800" />

        {/* Tema da Interface */}
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
            Tema da Interface
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleThemeChange('claro')}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${data.settings.theme === 'claro'
                ? 'bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-slate-800 dark:text-white dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
            >
              <Sun className="w-4 h-4" /> Claro
            </button>
            <button
              onClick={() => handleThemeChange('escuro')}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${data.settings.theme === 'escuro'
                ? 'bg-indigo-900 border-indigo-600 text-white dark:bg-slate-800 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
            >
              <Moon className="w-4 h-4" /> Escuro
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${data.settings.theme === 'auto'
                ? 'bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-slate-800 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
            >
              <Laptop className="w-4 h-4" /> Auto
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Alertas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-pink-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Alertas</h3>
        </div>

        {/* Preço de Cripto */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Preço de Cripto</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Notificar variações acima de 5%
            </p>
          </div>
          <input
            type="checkbox"
            checked={data.settings.cryptoPriceAlert}
            onChange={(e) => handleUpdateSettings({ cryptoPriceAlert: e.target.checked })}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
          />
        </div>

        <hr className="border-indigo-50 dark:border-slate-800" />

        {/* Vencimento de Contas */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Vencimento de Contas
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Avisar 2 dias antes do vencimento
            </p>
          </div>
          <input
            type="checkbox"
            checked={data.settings.billDueDateAlert}
            onChange={(e) => handleUpdateSettings({ billDueDateAlert: e.target.checked })}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Card 3: Categorias de Gastos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Categorias de Gastos
            </h3>
          </div>
          <button
            onClick={() => alert('Recurso para personalizar categorias disponível em edições avançadas.')}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <Utensils className="w-4 h-4 text-pink-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Alimentação
            </span>
          </div>
          <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <Car className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Transporte
            </span>
          </div>
          <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Energia
            </span>
          </div>
          <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <GlassWaterIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Água
            </span>
          </div>
          <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <Network className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Internet
            </span>
          </div>

          <div className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center gap-3">
            <Home className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Outros
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Sincronização de Dados (Vibrant Banner) */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-xl shadow-indigo-200/50 dark:shadow-none border border-indigo-800/50 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-800/50 rounded-2xl text-indigo-200 border border-indigo-700/40">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-pink-400' : ''}`} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Sincronização de Dados</h3>
            <p className="text-[11px] text-indigo-200 mt-0.5 font-medium">
              Última sincronização: {data.settings.lastSync}. Firebase ativado.
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          id="sync-now-button"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
        </button>
      </div>

      {/* Card 6: Zona de Perigo */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-rose-100 dark:border-rose-900/30 space-y-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Zona de Perigo</h3>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Esta ação apagará permanentemente todas as transações e dados salvos no Firebase para esta conta.
        </p>
        <button
          onClick={async () => {
            if (window.confirm('Tem certeza absoluta que deseja ZERAR todo o banco de dados? Esta ação NÃO pode ser desfeita.')) {
              await resetToDemoData();
              alert('Banco de dados zerado com sucesso!');
            }
          }}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-rose-600 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-rose-200 dark:border-rose-800"
        >
          <RotateCcw className="w-4 h-4" /> Zerar Banco de Dados
        </button>
      </div>

      {/* Card 7: Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-bold">Sair da Conta</span>
      </button>
    </div>
  );
};
