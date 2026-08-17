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

            // --- INÍCIO AUTO GENERATE FIXED BILLS ---
            const todayStr = new Date().toISOString().split('T')[0];
            const currentYyyyMm = todayStr.substring(0, 7);

            // 1. Limpar contas geradas erroneamente no passado (antes do mês de início)
            const wronglyGeneratedIds: string[] = [];
            (loadedData.fixedBills || []).forEach(fixedBill => {
              const bRecurrence = fixedBill.recurrence || 'mensal';
              const bMonthKey = fixedBill.dueDate ? fixedBill.dueDate.substring(0, 7) : '';

              updatedBills.forEach(bill => {
                if (bill.fixedBillId === fixedBill.id && bill.id.startsWith('b-auto-')) {
                  const billMonth = bill.dueDate.substring(0, 7);
                  let shouldExist = true;
                  if (bMonthKey) {
                    if (bRecurrence === 'unico') {
                      shouldExist = bMonthKey === billMonth;
                    } else {
                      shouldExist = bMonthKey <= billMonth;
                    }
                  }
                  if (!shouldExist) {
                    wronglyGeneratedIds.push(bill.id);
                  }
                }
              });
            });

            if (wronglyGeneratedIds.length > 0) {
              updatedBills = updatedBills.filter(b => !wronglyGeneratedIds.includes(b.id));
              needsUpdate = true;
            }
            
            // 2. Gerar contas para o mês atual, se aplicável
            (loadedData.fixedBills || []).forEach(fixedBill => {
              const bRecurrence = fixedBill.recurrence || 'mensal';
              const bMonthKey = fixedBill.dueDate ? fixedBill.dueDate.substring(0, 7) : '';

              let shouldGenerate = true;
              if (bMonthKey) {
                if (bRecurrence === 'unico') {
                  shouldGenerate = bMonthKey === currentYyyyMm;
                } else {
                  shouldGenerate = bMonthKey <= currentYyyyMm;
                }
              }

              if (!shouldGenerate) return;

              let dueDay = "01";
              if (fixedBill.dueDate) {
                const parts = fixedBill.dueDate.split('-');
                if (parts.length === 3) dueDay = parts[2];
              }

              let expectedDueDate = `${currentYyyyMm}-${dueDay}`;
              let finalPaymentMethod: any = 'saldo';
              let finalIconName = 'FileText';

              if (fixedBill.paymentSource && fixedBill.paymentSource.startsWith('cc:')) {
                const cardId = fixedBill.paymentSource.split(':')[1];
                const card = (loadedData.creditCards || []).find(c => c.id === cardId);
                
                finalPaymentMethod = 'cartao';
                finalIconName = 'CreditCard';

                // Se a despesa é no mês currentYyyyMm, o dia de "compra" (ou de impacto) é o dueDay.
                const purchaseDay = parseInt(dueDay, 10);
                const closingDay = card ? card.closingDay : 30;
                const cardDueDay = card ? card.dueDay : 10;
                
                const [curYearStr, curMonthStr] = currentYyyyMm.split('-');
                let invoiceMonth = parseInt(curMonthStr, 10);
                let dueYear = parseInt(curYearStr, 10);

                // Se passou do fechamento, cai no PRÓXIMO mês de referência
                if (purchaseDay >= closingDay) {
                  invoiceMonth += 1;
                }

                // Agora, com base no mês de referência (invoiceMonth), qual o mês de vencimento?
                // Se fechamento > vencimento, a fatura vence no mês seguinte ao mês de referência
                let finalDueMonth = invoiceMonth;
                if (closingDay > cardDueDay) {
                  finalDueMonth += 1;
                }

                if (finalDueMonth > 12) {
                  finalDueMonth -= 12;
                  dueYear += 1;
                }
                
                expectedDueDate = `${dueYear}-${String(finalDueMonth).padStart(2, '0')}-${String(cardDueDay).padStart(2, '0')}`;
              } else if (fixedBill.paymentSource === 'Cartão de Crédito') {
                finalPaymentMethod = 'cartao';
                finalIconName = 'CreditCard';
                const [curYearStr, curMonthStr] = currentYyyyMm.split('-');
                let dueYear = parseInt(curYearStr);
                let dueMonthNum = parseInt(curMonthStr) + 1;
                if (dueMonthNum > 12) {
                  dueMonthNum = 1;
                  dueYear++;
                }
                expectedDueDate = `${dueYear}-${String(dueMonthNum).padStart(2, '0')}-10`;
              } else if (fixedBill.paymentSource === 'Pix') {
                finalPaymentMethod = 'pix';
              }
              
              const billId = `b-auto-${fixedBill.id}-${currentYyyyMm}`;
              const isDeleted = (loadedData.deletedGeneratedBills || []).includes(billId);
              
              // We check by ID to see if it already exists or if it was deleted
              const alreadyExists = updatedBills.some(b => b.id === billId) || isDeleted;

              if (!alreadyExists) {
                const newBill = {
                  id: billId,
                  title: fixedBill.name,
                  amount: fixedBill.amount,
                  dueDate: expectedDueDate,
                  status: 'pendente' as const,
                  category: fixedBill.category,
                  fixedBillId: fixedBill.id,
                  paymentMethod: finalPaymentMethod,
                  iconName: finalIconName,
                };
                updatedBills.unshift(newBill);
                needsUpdate = true;
              }
            });

            if (needsUpdate) {
              loadedData.bills = updatedBills;
              setDoc(docRef, loadedData);
            }
            // --- FIM AUTO GENERATE FIXED BILLS ---

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
