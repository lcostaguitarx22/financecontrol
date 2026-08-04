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
      const fullYear = year.length === 2 ? `20${year}` : year;
      const padDay = day.padStart(2, '0');
      const padMonth = month.padStart(2, '0');
      return `${padDay}/${padMonth}/${fullYear}`;
    }
  } catch (e) {
    // Return original
  }
  return dateString;
}

export function getDaysUntilDue(dateString: string): number | null {
  if (!dateString) return null;
  if (dateString.toLowerCase().includes('hoje')) return 0;
  if (dateString.toLowerCase().includes('amanhã') || dateString.toLowerCase().includes('amanha')) return 1;

  try {
    let year, month, day;
    if (dateString.includes('-')) {
      [year, month, day] = dateString.split('-');
    } else if (dateString.includes('/')) {
      [day, month, year] = dateString.split('/');
    }

    if (year && month && day) {
      const fullYear = year.length === 2 ? `20${year}` : year;
      const due = new Date(Number(fullYear), Number(month) - 1, Number(day));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
  } catch (e) {
    // Retorna nulo se der erro
  }
  return null;
}

