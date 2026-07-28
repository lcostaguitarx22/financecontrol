/**
 * @file Header.tsx
 * @description Cabeçalho superior com foto do usuário, título FinanceControl e sino de notificações.
 */

import React, { useState } from 'react';
import { Bell, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { NotificationModal } from './NotificationModal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'FinanceControl', showBack, onBack }) => {
  const { data } = useAppData();
  const [showNotifications, setShowNotifications] = useState(false);

  // Calcular número de alertas pendentes
  const pendingBillsCount = data.bills.filter((b) => b.status !== 'pago').length;
  const urgentCount = data.bills.filter((b) => b.isUrgent || b.status === 'atrasado').length;

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
            <div className="relative group cursor-pointer" id="header-user-avatar">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Perfil do Usuário"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/80 shadow-md shadow-indigo-200/50 dark:shadow-none group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
            </div>
          )}

          <div>
            <h1 className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg tracking-tight flex items-center gap-1.5">
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
