// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBL5YKl1S8vA9r4oxuQGnfpCe26TRmT8RY",
    authDomain: "plan-app-a2414.firebaseapp.com",
    projectId: "plan-app-a2414",
    storageBucket: "plan-app-a2414.firebasestorage.app",
    messagingSenderId: "914441393781",
    appId: "1:914441393781:web:2947e1090e35e2e75aca3c",
    measurementId: "G-7JGWGHPS98"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
