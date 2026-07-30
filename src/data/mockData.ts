/**
 * @file mockData.ts
 * @description Dados iniciais vazios para começar o app do zero.
 */

import { AppData } from '../types';

export const initialAppData: AppData = {
  settings: {
    currency: 'BRL',
    theme: 'claro',
    cryptoPriceAlert: true,
    billDueDateAlert: false,
    lastSync: 'Hoje, 14:30',
    hasSeenOnboarding: false,
    categories: [
      'Água', 'Assinaturas', 'Dízimo', 'Energia', 'Internet', 
      'IPTU', 'IPVA', 'Streaming', 'Telefonia', 'Parcela de Carro', 
      'Parcela Terreno', 'Outros'
    ],
  },
  transactions: [],
  cryptos: [],
  wallets: [],
  bills: [],
  budgets: [],
  fixedBills: [],
  monthlySalaries: {},
  monthlyExtras: {},
  salary: 0,
  rendimentos: [],
  totalAccumulatedYield: 0,
};
