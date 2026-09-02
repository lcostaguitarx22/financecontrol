/**
 * @file types.ts
 * @description Definições de tipos do sistema FinanceControl
 */

export type Currency = 'BRL' | 'USD';
export type ThemeMode = 'claro' | 'escuro' | 'auto';
export type TabType = 'home' | 'cripto' | 'financeiro' | 'contas' | 'mais';

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string or YYYY-MM-DD
  iconName?: string;
  source?: string;
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  unitPriceBrl: number;
  change24h: number; // Porcentagem, ex: 5.2
  iconUrl?: string;
  color?: string;
  walletId?: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: string; // Ex: "Trezor Model T", "Binance", "MetaMask"
  percentage: number;
  iconType: 'hardware' | 'exchange' | 'hot';
}

export type BillStatus = 'atrasado' | 'pendente' | 'pago';

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // Ex: "2023-11-15" ou "Vence Hoje"
  status: BillStatus;
  category: string;
  paymentMethod?: 'saldo' | 'pix' | 'cartao';
  paymentSource?: string;
  iconName?: string;
  isUrgent?: boolean;
  transactionId?: string;
  fixedBillId?: string;
}

export interface CategoryBudget {
  id: string;
  name: string;
  allocated: number;
  usedPercentage: number;
  iconName: string;
}

export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit?: number;
}

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate?: string; // e.g. "2026-08-05" from input date
  paymentSource?: string; // ID da carteira ou nome da conta
  recurrence?: 'mensal' | 'unico';
}

export interface RendimentoEntry {
  id: string;
  date: string;
  amount: number;
  variationPercentage?: number;
  label: string; // "Hoje", "Ontem", "Domingo", etc.
  type?: string; // 'Cofrinho', 'Saldo em conta', 'Emergência', 'Outros'
}

export interface AppSettings {
  currency: Currency;
  theme: ThemeMode;
  cryptoPriceAlert: boolean;
  billDueDateAlert: boolean;
  lastSync: string;
  hasSeenOnboarding: boolean;
  categories: string[];
}

export interface AppData {
  settings: AppSettings;
  transactions: Transaction[];
  cryptos: CryptoAsset[];
  wallets: Wallet[];
  bills: Bill[];
  budgets: CategoryBudget[];
  fixedBills: FixedBill[];
  creditCards?: CreditCard[];
  monthlySalaries?: Record<string, number>; // ex: { "2026-08": 5000, "2026-09": 5200 }
  monthlySalaryDates?: Record<string, string>; // ex: { "2026-08": "2026-08-05" }
  monthlyExtras?: Record<string, number>;
  salary?: number; // Deprecated, keep for backward compatibility temporarily
  rendimentos: RendimentoEntry[];
  totalAccumulatedYield: number;
  deletedGeneratedBills?: string[];
}
