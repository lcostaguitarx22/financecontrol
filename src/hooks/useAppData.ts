/**
 * @file useAppData.ts
 * @description Hook React para sincronizar os dados com o Firestore em tempo real.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';
import { initialAppData } from '../data/mockData';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { saveAppData } from '../services/storage';

export function useAppData() {
  const [data, setData] = useState<AppData>(initialAppData);

  useEffect(() => {
    const docRef = doc(db, 'appData', 'main');
    
    // Escuta mudanças em tempo real no Firestore
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as AppData);
      } else {
        // Inicializa se não existir
        setDoc(docRef, initialAppData);
      }
    }, (error) => {
      console.error('Erro ao escutar Firestore:', error);
    });

    return () => unsubscribe();
  }, []);

  // Mantemos a função para compatibilidade com a UI atual, mas 
  // idealmente o onSnapshot cuida das atualizações
  const updateData = (updater: (prev: AppData) => AppData) => {
    const updated = updater(data);
    setData(updated); // Atualização otimista
    saveAppData(updated); // Salva no back-end
  };

  // Dummy reloadData para não quebrar compatibilidade
  const reloadData = useCallback(() => {}, []);

  return { data, setData: updateData, reloadData };
}
