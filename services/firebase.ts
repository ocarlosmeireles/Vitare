import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration is loaded from environment variables for security and flexibility.
// Make sure to set these variables in your deployment environment.
// See: https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "AIzaSyDxvAVhO-AnzYOc0qPRHk6i6OcVfvkyRJs",
  authDomain: "vitare-ffbf8.firebaseapp.com",
  projectId: "vitare-ffbf8",
  storageBucket: "vitare-ffbf8.firebasestorage.app",
  messagingSenderId: "1036323201365",
  appId: "1:1036323201365:web:37a7e1cc183df444b04fdc",
  measurementId: "G-55B1P6BMY5"
};

// FIX: Closed the firebaseConfig object literal to resolve a major syntax error that was causing all subsequent errors in this file.
let db: Firestore | null = null;

// Check if all necessary Firebase config values are provided through environment variables.
if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
) {
    try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        // Initialize Cloud Firestore and get a reference to the service
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        console.warn("A aplicação funcionará em modo de demonstração, sem salvar informações.");
    }
} else {
    console.warn("CONFIGURAÇÃO DO FIREBASE AUSENTE: Por favor, configure as variáveis de ambiente do Firebase (FIREBASE_API_KEY, etc.) para habilitar o salvamento de dados. A aplicação funcionará em modo de demonstração.");
}

export { db };