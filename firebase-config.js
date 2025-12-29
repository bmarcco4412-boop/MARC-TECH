/* 
 * PAY FUSION - MOTEUR DE DONNÉES CENTRALISÉ
 * Développement Professionnel - 2025
 * Configuration : bmarcco4412@gmail.com
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION FIREBASE RÉELLE ---
const firebaseConfig = {
  apiKey: "AIzaSyB5_KighCQRfslRjZtGZPxs3OUqqQRk7IE",
  authDomain: "pay-fusion-26a79.firebaseapp.com",
  projectId: "pay-fusion-26a79",
  storageBucket: "pay-fusion-26a79.firebasestorage.app",
  messagingSenderId: "771406909196",
  appId: "1:771406909196:web:27bdf4db07ad8d08418329"
};

// --- INITIALISATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- LOGIQUE MÉTIER PARTAGÉE ---

// Taux de change fixe
export const EXCHANGE_RATE = 150;

// Vérification du rôle Administrateur
export const isUserAdmin = (email) => {
  return email === 'bmarcco4412@gmail.com';
};

// Formatage professionnel des montants HTG
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-HT', {
    style: 'decimal',
    minimumFractionDigits: 2
  }).format(amount) + " HTG";
};

export { auth, db };

/* 
 * 🚨 RÈGLES DE SÉCURITÉ FIRESTORE (À COPIER DANS LA CONSOLE FIREBASE)
 * 
 * match /databases/{database}/documents {
 *   
 *   // Règle pour les profils utilisateurs
 *   match /users/{userId} {
 *     allow read, update: if request.auth != null && (request.auth.uid == userId || request.auth.token.email == 'bmarcco4412@gmail.com');
 *     allow create: if request.auth != null;
 *   }
 *   
 *   // Règle pour les commandes (Orders)
 *   match /orders/{orderId} {
 *     allow create: if request.auth != null;
 *     allow read: if request.auth != null && (resource.data.userId == request.auth.uid || request.auth.token.email == 'bmarcco4412@gmail.com');
 *     allow update, delete: if request.auth != null && request.auth.token.email == 'bmarcco4412@gmail.com';
 *   }
 *   
 *   // Règle pour les statistiques et annonces
 *   match /announcements/{id} {
 *     allow read: if request.auth != null;
 *     allow write: if request.auth != null && request.auth.token.email == 'bmarcco4412@gmail.com';
 *   }
 * }
 */