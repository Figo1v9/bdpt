import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAjtWQE-3kBj2fokrUto1kmFYBev6AtGGo",
  authDomain: "agami-22f90.firebaseapp.com",
  databaseURL: "https://agami-22f90-default-rtdb.firebaseio.com",
  projectId: "agami-22f90",
  storageBucket: "agami-22f90.firebasestorage.app",
  messagingSenderId: "1031920537245",
  appId: "1:1031920537245:web:6958d74a877fe84ec88e74",
  measurementId: "G-SRSD29ZQZD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);