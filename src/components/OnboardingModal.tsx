/**
 * @file OnboardingModal.tsx
 * @description Modal de onboarding rápido exibido na primeira utilização do app.
 */

import React, { useState } from 'react';
import { Wallet, Bitcoin, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { updateSettings } from '../services/storage';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Bem-vindo ao FinanceControl',
      description: 'Tenha controle absoluto das suas finanças pessoais e investimentos em um só lugar.',
      icon: Wallet,
      badge: 'Visão Consolidada',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Acompanhe seu Portfólio Cripto',
      description: 'Monitore carteiras Hardware, Exchanges e Hot Wallets com cotações em tempo real e gráficos de evolução.',
      icon: Bitcoin,
      badge: 'Ativos Digitais',
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    {
      title: 'Contas & Fluxo de Caixa',
      description: 'Nunca mais perca o vencimento de uma conta. Planeje despesas e veja alertas inteligentes.',
      icon: ShieldCheck,
      badge: 'Alertas Inteligentes',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
  ];

  const handleFinish = () => {
    updateSettings({ hasSeenOnboarding: true });
    onComplete();
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-indigo-100 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />

        {/* Badge e Ícone */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 mb-6 border border-indigo-100 dark:border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          {currentStep.badge}
        </div>

        <div className={`w-20 h-20 mx-auto rounded-3xl ${currentStep.color} flex items-center justify-center mb-6 shadow-xs`}>
          <Icon className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          {currentStep.title}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
          {currentStep.description}
        </p>

        {/* Indicador de passos */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${index === step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
            />
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2.5">
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              id="onboarding-next-button"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              id="onboarding-finish-button"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-95 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              Começar a Usar <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {step < steps.length - 1 && (
            <button
              onClick={handleFinish}
              id="onboarding-skip-button"
              className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 text-xs font-bold transition-colors"
            >
              Pular tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
