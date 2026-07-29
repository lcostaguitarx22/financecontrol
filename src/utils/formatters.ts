/**
 * @file formatters.ts
 * @description Funções utilitárias de formatação financeira e de datas.
 */

import { Currency } from '../types';

export function formatCurrency(value: number, currency: Currency = 'BRL', autoConvert: boolean = true): string {
  const symbol = currency === 'USD' ? '$' : 'R$';
  const multiplier = (currency === 'USD' && autoConvert) ? 0.19 : 1; // Conversão aproximada
  const converted = value * multiplier;

  const formatted = converted.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formatted}`;
}

export function formatBtc(value: number): string {
  return `₿ ${value.toFixed(4)}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDateBr(dateString: string): string {
  if (!dateString) return '';
  // Se for texto amigável já formatado (ex: "Venceu ontem", "10 Nov")
  if (dateString.includes('Vence') || dateString.includes('Nov') || dateString.includes('Hoje')) {
    return dateString;
  }
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      const monthIdx = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${months[monthIdx] || ''} ${year}`;
    }
  } catch (e) {
    // Return original
  }
  return dateString;
}
