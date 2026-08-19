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
  Smartphone,
  Shield,
  Download,
  Bell,
  Trash2,
  ArrowRight,
  UserCircle,
  Car,
  Lightbulb,
  GlassWater as GlassWaterIcon,
  Network,
  Home,
  Plus,
  ChevronDown,
  ChevronUp,
  Utensils,
  TrendingUp,
  RotateCcw,
  Sparkles,
  X,
  RefreshCw,
  LogOut,
  FileSpreadsheet
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppData } from '../hooks/useAppData';
import { updateSettings } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { CreditCard as CreditCardIcon } from 'lucide-react';
import { CreditCard, AppData, Currency, ThemeMode } from '../types';

interface MorePageProps {
  onOpenRendimento: () => void;
}

export const MorePage: React.FC<MorePageProps> = ({ onOpenRendimento }) => {
  const { data, setData } = useAppData();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showCreditCards, setShowCreditCards] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardClosing, setNewCardClosing] = useState('');
  const [newCardDue, setNewCardDue] = useState('');

  const categories = data.settings.categories || [
    'Água', 'Assinaturas', 'Dízimo', 'Energia', 'Internet',
    'IPTU', 'IPVA', 'Streaming', 'Telefonia', 'Parcela de Carro',
    'Parcela Terreno', 'Outros'
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const currentCats = [...categories];
    if (!currentCats.includes(newCategoryName)) {
      currentCats.push(newCategoryName);
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          categories: currentCats
        }
      }));
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleUpdateSettings = (partialSettings: Partial<AppData['settings']>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partialSettings }
    }));
  };

  const creditCards = data.creditCards || [];

  const handleAddCreditCard = () => {
    if (!newCardName.trim() || !newCardClosing || !newCardDue) {
      alert('Preencha todos os campos do cartão.');
      return;
    }
    const closingDay = parseInt(newCardClosing, 10);
    const dueDay = parseInt(newCardDue, 10);
    if (isNaN(closingDay) || closingDay < 1 || closingDay > 31 || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      alert('Dias de fechamento e vencimento devem ser entre 1 e 31.');
      return;
    }

    const newCard: CreditCard = {
      id: `cc-${Date.now()}`,
      name: newCardName.trim(),
      closingDay,
      dueDay,
    };

    setData((prev) => ({
      ...prev,
      creditCards: [...(prev.creditCards || []), newCard]
    }));
    
    setIsAddingCard(false);
    setNewCardName('');
    setNewCardClosing('');
    setNewCardDue('');
  };

  const handleDeleteCreditCard = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cartão? As contas já geradas manterão a data de vencimento atual.')) {
      setData((prev) => ({
        ...prev,
        creditCards: (prev.creditCards || []).filter(c => c.id !== id)
      }));
    }
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

      {/* Card 2.5: Cartões de Crédito */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowCreditCards(!showCreditCards)}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <CreditCardIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Meus Cartões de Crédito
            </h3>
          </div>
          <button
            className="p-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors shadow-xs"
          >
            {showCreditCards ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCreditCards && (
          <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
            {creditCards.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">Nenhum cartão cadastrado.</p>
            ) : (
              creditCards.map((card) => (
                <div key={card.id} className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between gap-3 border border-indigo-50 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{card.name}</p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteCreditCard(card.id)} className="p-2 hover:bg-pink-100 dark:hover:bg-pink-900/30 text-slate-400 hover:text-pink-600 transition-colors rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
            
            {isAddingCard ? (
              <div className="mt-4 p-3 border border-indigo-100 dark:border-slate-700 rounded-2xl space-y-3 bg-white dark:bg-slate-900">
                <input
                  type="text"
                  placeholder="Nome do Cartão (ex: Nubank)"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Dia do Fechamento</label>
                    <input
                      type="number"
                      placeholder="Ex: 25"
                      value={newCardClosing}
                      onChange={(e) => setNewCardClosing(e.target.value)}
                      className="w-full px-3 py-2 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Dia do Vencimento</label>
                    <input
                      type="number"
                      placeholder="Ex: 05"
                      value={newCardDue}
                      onChange={(e) => setNewCardDue(e.target.value)}
                      className="w-full px-3 py-2 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddCreditCard} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
                    Salvar Cartão
                  </button>
                  <button onClick={() => setIsAddingCard(false)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingCard(true)}
                className="w-full mt-2 p-3 border-2 border-dashed border-indigo-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Cartão
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card 3: Categorias de Gastos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800 space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowCategories(!showCategories)}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Categorias de Gastos
            </h3>
          </div>
          <button
            className="p-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors shadow-xs"
          >
            {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCategories && (
          <div className="space-y-2 pt-2">
            {categories.map((cat, index) => (
              <div key={index} className="p-3 bg-indigo-50/40 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cat}
                  </span>
                </div>
              </div>
            ))}
            
            {isAddingCategory ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da nova categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-indigo-50/30 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingCategory(true)}
                className="w-full mt-2 p-3 border-2 border-dashed border-indigo-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar Categoria
              </button>
            )}
          </div>
        )}
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
