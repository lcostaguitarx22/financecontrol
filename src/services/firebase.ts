// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_etDs59BY_qR5BZVdUT-Ij4hj98JFWh4",
  authDomain: "financecontrolbase.firebaseapp.com",
  projectId: "financecontrolbase",
  storageBucket: "financecontrolbase.firebasestorage.app",
  messagingSenderId: "1046008691122",
  appId: "1:1046008691122:web:2da41d3eee1ef1d35bccab",
  measurementId: "G-XW46S3KNG3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
