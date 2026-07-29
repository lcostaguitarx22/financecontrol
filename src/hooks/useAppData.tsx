import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';
import { initialAppData } from '../data/mockData';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { saveAppData } from '../services/storage';
import { fetchUSDBRL, fetchCryptoPrices, LivePrices } from '../services/api';

interface AppDataContextProps {
  data: AppData;
  setData: (updater: (prev: AppData) => AppData) => void;
  reloadData: () => void;
  user: User | null;
  loading: boolean;
  livePrices: LivePrices | null;
}

const AppDataContext = createContext<AppDataContextProps>({
  data: initialAppData,
  setData: () => {},
  reloadData: () => {},
  user: null,
  loading: true,
  livePrices: null,
});

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(initialAppData);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<LivePrices | null>(null);

  const cryptoSymbols = data.cryptos.map(c => c.symbol).join(',');

  useEffect(() => {
    let mounted = true;
    
    async function loadPrices() {
      if (!user) return;
      const usdToBrl = await fetchUSDBRL();
      const symbols = cryptoSymbols ? cryptoSymbols.split(',') : [];
      const cryptos = symbols.length > 0 ? await fetchCryptoPrices(symbols) : {};
      
      if (mounted) {
        setLivePrices({ usdToBrl, cryptos });
      }
    }
    
    const timer = setTimeout(loadPrices, 1000); // Evitar spam na API inicial
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [cryptoSymbols, user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const dbData = docSnap.data();
            let loadedData = {
              ...initialAppData,
              ...dbData,
              settings: { ...initialAppData.settings, ...(dbData.settings || {}) }
            } as AppData;
            
            // --- INÍCIO AUTO-PAYER ---
            // Verifica se há contas pendentes que atingiram a data de vencimento
            let needsUpdate = false;
            const todayStr = new Date().toISOString().split('T')[0];
            const updatedBills = [...loadedData.bills];
            const newTransactions = [];

            for (let i = 0; i < updatedBills.length; i++) {
              const bill = updatedBills[i];
              if (bill.status === 'pendente') {
                const parts = bill.dueDate.split('/');
                if (parts.length === 3) {
                  const billDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  if (billDateStr <= todayStr) {
                    const txId = `tx-auto-${Date.now()}-${i}`;
                    updatedBills[i] = { ...bill, status: 'pago', transactionId: txId };
                    newTransactions.push({
                      id: txId,
                      description: `Pgto Automático: ${bill.title}`,
                      amount: bill.amount,
                      type: 'despesa' as const,
                      category: bill.category || 'Utilidades',
                      date: billDateStr,
                    });
                    needsUpdate = true;
                  }
                }
              }
            }

            if (needsUpdate) {
              loadedData.bills = updatedBills;
              // adiciona as novas transações no topo
              loadedData.transactions = [...newTransactions, ...loadedData.transactions];
              // Atualiza o firestore silenciosamente
              setDoc(docRef, loadedData);
            }
            // --- FIM AUTO-PAYER ---

            setData(loadedData);
          } else {
            setDoc(docRef, initialAppData);
          }
          setLoading(false);
        }, (error) => {
          console.error('Erro ao escutar Firestore:', error);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setData(initialAppData);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateData = (updater: (prev: AppData) => AppData) => {
    const updated = updater(data);
    setData(updated);
    saveAppData(updated);
  };

  const reloadData = useCallback(() => {}, []);

  return (
    <AppDataContext.Provider value={{ data, setData: updateData, reloadData, user, loading, livePrices }}>
      {children}
    </AppDataContext.Provider>
  );
};

export function useAppData() {
  return useContext(AppDataContext);
}
