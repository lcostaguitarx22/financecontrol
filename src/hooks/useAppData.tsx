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
            
            // --- INÍCIO MIGRAÇÃO DE DATAS (DD/MM/YYYY para YYYY-MM-DD) ---
            let needsUpdate = false;
            let updatedBills = [...loadedData.bills];
            
            updatedBills = updatedBills.map(bill => {
              if (bill.dueDate && bill.dueDate.includes('/')) {
                const parts = bill.dueDate.split('/');
                if (parts.length === 3) {
                  const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                  needsUpdate = true;
                  return { ...bill, dueDate: `${y}-${parts[1]}-${parts[0]}` };
                }
              }
              return bill;
            });
            // --- FIM MIGRAÇÃO DE DATAS ---

            // --- INÍCIO REMOÇÃO DE CONTAS AUTOMÁTICAS ---
            let needsUpdateBills = false;
            let currentBills = [...loadedData.bills];
            
            // Remove contas geradas automaticamente que ainda estão pendentes
            const originalLength = currentBills.length;
            currentBills = currentBills.filter(b => !(b.id.startsWith('b-auto-') && b.status === 'pendente'));
            
            if (currentBills.length !== originalLength) {
              needsUpdateBills = true;
            }

            if (needsUpdateBills) {
              loadedData.bills = currentBills;
              setDoc(docRef, loadedData);
            }
            // --- FIM REMOÇÃO DE CONTAS AUTOMÁTICAS ---

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
