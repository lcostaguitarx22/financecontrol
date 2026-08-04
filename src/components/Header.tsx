/**
 * @file Header.tsx
 * @description Cabeçalho superior com foto do usuário, título FinanceControl e sino de notificações.
 */

import React, { useState } from 'react';
import { Bell, Sparkles, CheckCircle2, Wallet, Settings, LogOut } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { NotificationModal } from './NotificationModal';
import { getDaysUntilDue } from '../utils/formatters';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Finance Control', showBack, onBack, onSettingsClick }) => {
  const { data, user } = useAppData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Calcular número de alertas pendentes
  const pendingBillsCount = data.bills.filter((b) => b.status !== 'pago').length;
  const urgentCount = data.bills.filter((b) => {
    if (b.isUrgent || b.status === 'atrasado') return true;
    if (b.status === 'pendente') {
      const days = getDaysUntilDue(b.dueDate);
      if (days !== null && days <= 2) return true;
    }
    return false;
  }).length;

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const userPhoto = user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-5 py-3.5 border-b border-indigo-100/60 dark:border-slate-800/60 shadow-xs">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              id="header-back-button"
              className="p-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="relative">
              <div 
                className="relative group cursor-pointer" 
                id="header-user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img
                  src={userPhoto}
                  alt="Perfil do Usuário"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/80 shadow-md shadow-indigo-200/50 dark:shadow-none group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
              </div>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-indigo-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSettingsClick && onSettingsClick();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      Configurações
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col justify-center">
            {!showBack && (
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">
                Seja bem vindo Sr(a). {userName}, aproveite as Novidades!
              </p>
            )}
            <h1 className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg tracking-tight flex items-center gap-1.5 leading-none">
              <Wallet className="w-5 h-5 text-indigo-500" />
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            id="header-notification-button"
            className="relative p-2 rounded-full hover:bg-pink-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {urgentCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-pink-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
};
