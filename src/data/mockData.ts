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
  },
  transactions: [],
  cryptos: [],
  wallets: [],
  bills: [],
  budgets: [],
  fixedBills: [],
  monthlySalaries: {},
  salary: 0,
  rendimentos: [],
  totalAccumulatedYield: 0,
};
