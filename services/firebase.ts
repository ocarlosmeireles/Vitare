import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration is loaded from environment variables for security and flexibility.
// Make sure to set these variables in your deployment environment.
// See: https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

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
