/**
 * @file storage.ts
 * @description Serviço de persistência utilizando Firebase Firestore para armazenar os dados.
 */

import { AppData, Bill, CryptoAsset, Transaction, RendimentoEntry, Wallet } from '../types';
import { initialAppData } from '../data/mockData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

const getUserDocRef = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return doc(db, 'users', user.uid);
};

export async function getAppData(): Promise<AppData> {
  try {
    const docSnap = await getDoc(getUserDocRef());
    if (docSnap.exists()) {
      const parsed = docSnap.data() as AppData;
      return {
        ...initialAppData,
        ...parsed,
        settings: { ...initialAppData.settings, ...(parsed.settings || {}) },
      };
    } else {
      await setDoc(getUserDocRef(), initialAppData);
      return initialAppData;
    }
  } catch (error) {
    console.error('Erro ao ler dados do Firestore:', error);
    return initialAppData;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await setDoc(getUserDocRef(), data);
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
  let transactionToAdd: Transaction | null = null;
  let transactionToRemove: string | null = null;

  data.bills = data.bills.map((b) => {
    if (b.id === id) {
      if (b.status === 'pago') {
        // Mudando para pendente
        if (b.transactionId) {
          transactionToRemove = b.transactionId;
        }
        return { ...b, status: 'pendente', transactionId: undefined };
      } else {
        // Mudando para pago
        const newTxId = `tx-${Date.now()}`;
        transactionToAdd = {
          id: newTxId,
          description: `Pgto Manual: ${b.title}`,
          amount: b.amount,
          type: 'despesa',
          category: b.category || 'Utilidades',
          date: new Date().toISOString().split('T')[0],
        };
        return { ...b, status: 'pago', transactionId: newTxId };
      }
    }
    return b;
  });

  if (transactionToRemove) {
    data.transactions = data.transactions.filter(t => t.id !== transactionToRemove);
  }
  if (transactionToAdd) {
    data.transactions.unshift(transactionToAdd);
  }

  await saveAppData(data);
}

export async function deleteBill(id: string): Promise<void> {
  const data = await getAppData();
  data.bills = data.bills.filter((b) => b.id !== id);
  await saveAppData(data);
}

export async function updateBill(id: string, billUpdate: Partial<Omit<Bill, 'id'>>): Promise<void> {
  const data = await getAppData();
  data.bills = data.bills.map(b => {
    if (b.id === id) {
      return { ...b, ...billUpdate };
    }
    return b;
  });
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

export async function updateCryptoAsset(id: string, assetUpdate: Partial<Omit<CryptoAsset, 'id'>>): Promise<void> {
  const data = await getAppData();
  data.cryptos = data.cryptos.map(c => {
    if (c.id === id) {
      return { ...c, ...assetUpdate };
    }
    return c;
  });
  await saveAppData(data);
}

export async function deleteCryptoAsset(id: string): Promise<void> {
  const data = await getAppData();
  data.cryptos = data.cryptos.filter(c => c.id !== id);
  await saveAppData(data);
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

export async function addWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
  const data = await getAppData();
  const newWallet: Wallet = {
    ...wallet,
    id: `w-${Date.now()}`,
  };
  data.wallets.push(newWallet);
  await saveAppData(data);
  return newWallet;
}

export async function updateWallet(id: string, walletUpdate: Partial<Omit<Wallet, 'id'>>): Promise<void> {
  const data = await getAppData();
  data.wallets = data.wallets.map(w => {
    if (w.id === id) {
      return { ...w, ...walletUpdate };
    }
    return w;
  });
  await saveAppData(data);
}

export async function deleteWallet(id: string): Promise<void> {
  const data = await getAppData();
  data.wallets = data.wallets.filter(w => w.id !== id);
  // Optional: Also delete cryptos belonging to this wallet, or unassign them
  data.cryptos = data.cryptos.map(c => {
    if (c.walletId === id) {
      const { walletId, ...rest } = c;
      return rest;
    }
    return c;
  });
  await saveAppData(data);
}
