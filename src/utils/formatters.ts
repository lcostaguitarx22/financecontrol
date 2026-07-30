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
    let year, month, day;
    if (dateString.includes('-')) {
      [year, month, day] = dateString.split('-');
    } else if (dateString.includes('/')) {
      [day, month, year] = dateString.split('/');
    }

    if (year && month && day) {
      const shortYear = year.length === 4 ? year.slice(-2) : year;
      const padDay = day.padStart(2, '0');
      const padMonth = month.padStart(2, '0');
      return `${padDay}/${padMonth}/${shortYear}`;
    }
  } catch (e) {
    // Return original
  }
  return dateString;
}
