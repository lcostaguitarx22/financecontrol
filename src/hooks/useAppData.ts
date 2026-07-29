/**
 * @file useAppData.ts
 * @description Hook React para sincronizar os dados com o Firestore em tempo real.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';
import { initialAppData } from '../data/mockData';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { saveAppData } from '../services/storage';

export function useAppData() {
  const [data, setData] = useState<AppData>(initialAppData);

  useEffect(() => {
    // 1. Faz o login anônimo (invisível para o usuário)
    signInAnonymously(auth).catch((error) => {
      console.error('Erro no login anônimo:', error);
    });

    // 2. Aguarda o usuário estar autenticado para buscar seus dados
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setData(docSnap.data() as AppData);
          } else {
            setDoc(docRef, initialAppData);
          }
        }, (error) => {
          console.error('Erro ao escutar Firestore:', error);
        });

        return () => unsubscribeSnapshot();
      } else {
        setData(initialAppData);
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

  return { data, setData: updateData, reloadData };
}
