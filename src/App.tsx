/**
 * @file App.tsx
 * @description Componente principal do FinanceControl montando cabeçalho, navegação, lazy-loading de páginas e onboarding.
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { useAppData } from './hooks/useAppData';
import { TabType } from './types';
import { LoginPage } from './pages/LoginPage';

// Lazy loading das páginas para máxima performance
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const CryptoPage = lazy(() =>
  import('./pages/CryptoPage').then((module) => ({ default: module.CryptoPage }))
);
const FinancePage = lazy(() =>
  import('./pages/FinancePage').then((module) => ({ default: module.FinancePage }))
);
const BillsPage = lazy(() =>
  import('./pages/BillsPage').then((module) => ({ default: module.BillsPage }))
);
const MorePage = lazy(() =>
  import('./pages/MorePage').then((module) => ({ default: module.MorePage }))
);
const RendimentoPage = lazy(() =>
  import('./pages/RendimentoPage').then((module) => ({ default: module.RendimentoPage }))
);

export default function App() {
  const { data, user, loading } = useAppData();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showRendimentoPage, setShowRendimentoPage] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Inicializar tema e onboarding na primeira execução
  useEffect(() => {
    if (user && !data.settings.hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    // Configurar classe dark mode no HTML de acordo com a preferência
    if (data.settings.theme === 'escuro') {
      document.documentElement.classList.add('dark');
    } else if (data.settings.theme === 'claro') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [data.settings.hasSeenOnboarding, data.settings.theme]);

  // Resetar a tab para home quando o usuário logar
  useEffect(() => {
    if (user) {
      setActiveTab('home');
      setShowRendimentoPage(false);
    }
  }, [user]);

  // Handler de navegação de abas
  const handleTabChange = (tab: TabType) => {
    setShowRendimentoPage(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-slate-50 to-pink-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Container responsivo mobile-first */}
      <div className="max-w-7xl mx-auto min-h-screen flex flex-col relative bg-white/70 dark:bg-slate-950/90 backdrop-blur-3xl shadow-2xl shadow-indigo-200/50 dark:shadow-none sm:border-x sm:border-indigo-100/60 dark:sm:border-slate-800/60">
        {/* Cabeçalho */}
        <Header
          title={showRendimentoPage ? 'Resumo de Rendimentos' : 'Finance Control'}
          showBack={showRendimentoPage}
          onBack={() => setShowRendimentoPage(false)}
        />

        {/* Conteúdo com Lazy Loading e Transições de Animação */}
        <main className="flex-1 px-4 pt-3">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Carregando Finanças...</span>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              {showRendimentoPage ? (
                <motion.div
                  key="rendimento"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RendimentoPage onBack={() => setShowRendimentoPage(false)} />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'home' && (
                    <HomePage
                      onNavigateTab={handleTabChange}
                      onOpenRendimento={() => setShowRendimentoPage(true)}
                    />
                  )}
                  {activeTab === 'cripto' && <CryptoPage />}
                  {activeTab === 'financeiro' && <FinancePage />}
                  {activeTab === 'contas' && <BillsPage />}
                  {activeTab === 'mais' && (
                    <MorePage onOpenRendimento={() => setShowRendimentoPage(true)} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </main>

        {/* Navegação Inferior */}
        {!showRendimentoPage && (
          <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
        )}

        {/* Modal de Onboarding */}
        {showOnboarding && (
          <OnboardingModal onComplete={() => setShowOnboarding(false)} />
        )}
      </div>
    </div>
  );
}
