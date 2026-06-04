// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuRIVsln1oHbdPYVK7b3_aaq_cayUflo8",
  authDomain: "mis-xv-melanie-8aae1.firebaseapp.com",
  projectId: "mis-xv-melanie-8aae1",
  storageBucket: "mis-xv-melanie-8aae1.firebasestorage.app",
  messagingSenderId: "529742948954",
  appId: "1:529742948954:web:d1f844ab250af79fa5c663"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);