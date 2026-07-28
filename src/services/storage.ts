/**
 * @file storage.ts
 * @description Serviço de persistência utilizando Firebase Firestore para armazenar os dados.
 */

import { AppData, Bill, CryptoAsset, Transaction, RendimentoEntry } from '../types';
import { initialAppData } from '../data/mockData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const docRef = doc(db, 'appData', 'main');

export async function getAppData(): Promise<AppData> {
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const parsed = docSnap.data() as AppData;
      return {
        ...initialAppData,
        ...parsed,
        settings: { ...initialAppData.settings, ...(parsed.settings || {}) },
      };
    } else {
      await setDoc(docRef, initialAppData);
      return initialAppData;
    }
  } catch (error) {
    console.error('Erro ao ler dados do Firestore:', error);
    return initialAppData;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await setDoc(docRef, data);
  } catch (error) {
    console.error('Erro ao salvar dados no Firestore:', error);
  }
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const data = await getAppData();
  const newTx: Transaction = {
    ...transaction,
    id: `tx-${Date.now()}`,
  };
  data.transactions.unshift(newTx);
  await saveAppData(data);
  return newTx;
}

export async function deleteTransaction(id: string): Promise<void> {
  const data = await getAppData();
  data.transactions = data.transactions.filter((t) => t.id !== id);
  await saveAppData(data);
}

export async function addBill(bill: Omit<Bill, 'id'>): Promise<Bill> {
  const data = await getAppData();
  const newBill: Bill = {
    ...bill,
    id: `b-${Date.now()}`,
  };
  data.bills.unshift(newBill);
  await saveAppData(data);
  return newBill;
}

export async function toggleBillPaid(id: string): Promise<void> {
  const data = await getAppData();
  data.bills = data.bills.map((b) => {
    if (b.id === id) {
      const nextStatus = b.status === 'pago' ? 'pendente' : 'pago';
      return { ...b, status: nextStatus };
    }
    return b;
  });
  await saveAppData(data);
}

export async function deleteBill(id: string): Promise<void> {
  const data = await getAppData();
  data.bills = data.bills.filter((b) => b.id !== id);
  await saveAppData(data);
}

export async function addCryptoAsset(asset: Omit<CryptoAsset, 'id'>): Promise<CryptoAsset> {
  const data = await getAppData();
  const newCrypto: CryptoAsset = {
    ...asset,
    id: `c-${Date.now()}`,
  };
  data.cryptos.push(newCrypto);
  await saveAppData(data);
  return newCrypto;
}

export async function addRendimento(entry: Omit<RendimentoEntry, 'id'>): Promise<RendimentoEntry> {
  const data = await getAppData();
  const newEntry: RendimentoEntry = {
    ...entry,
    id: `rd-${Date.now()}`,
  };
  data.rendimentos.unshift(newEntry);
  data.totalAccumulatedYield += entry.amount;
  await saveAppData(data);
  return newEntry;
}

export async function updateSettings(partialSettings: Partial<AppData['settings']>): Promise<void> {
  const data = await getAppData();
  data.settings = { ...data.settings, ...partialSettings };
  await saveAppData(data);
}

export async function resetToDemoData(): Promise<void> {
  await saveAppData(initialAppData);
}
