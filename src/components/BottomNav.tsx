/**
 * @file BottomNav.tsx
 * @description Barra de navegação inferior com ícones ativos e indicador visual.
 */

import React from 'react';
import { Home, Bitcoin, ReceiptText, CalendarCheck, Sliders } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'cripto' as TabType, label: 'Cripto', icon: Bitcoin },
    { id: 'financeiro' as TabType, label: 'Financeiro', icon: ReceiptText },
    { id: 'contas' as TabType, label: 'Contas', icon: CalendarCheck },
    { id: 'mais' as TabType, label: 'Mais', icon: Sliders },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-indigo-100/60 dark:border-slate-800/60 px-2 py-2 mt-auto">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              id={`nav-tab-${tab.id}`}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[60px] ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-500 dark:bg-pink-400 rounded-full shadow-xs" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
