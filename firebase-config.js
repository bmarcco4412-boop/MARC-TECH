// firebase-config.js

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5_KighCQRfslRjZtGZPxs3OUqqQRk7IE",
  authDomain: "pay-fusion-26a79.firebaseapp.com",
  projectId: "pay-fusion-26a79",
  storageBucket: "pay-fusion-26a79.firebasestorage.app",
  messagingSenderId: "771406909196",
  appId: "1:771406909196:web:27bdf4db07ad8d08418329"
};

// Initialiser Firebase
let app;
let auth;
let db;
let storage;

try {
  // Vérifier si Firebase est déjà initialisé
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  
  // Initialiser les services
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();
  
  console.log("Firebase initialisé avec succès");
} catch (error) {
  console.error("Erreur d'initialisation Firebase:", error);
}

// ==================== FONCTIONS D'AUTHENTIFICATION ====================

/**
 * Inscrire un nouvel utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {string} fullName - Nom complet
 * @param {string} phone - Numéro de téléphone
 * @returns {Promise<Object>} - Résultat de l'inscription
 */
async function registerUser(email, password, fullName, phone) {
  try {
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Créer le document utilisateur dans Firestore
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email,
      fullName: fullName,
      phone: phone,
      balance: 0,
      role: 'user',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      notifications: [],
      transactions: [],
      orders: []
    });
    
    // Envoyer l'email de vérification
    await user.sendEmailVerification();
    
    return {
      success: true,
      user: user,
      message: "Inscription réussie. Veuillez vérifier votre email."
    };
    
  } catch (error) {
    console.error("Erreur d'inscription:", error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Connecter un utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} - Résultat de la connexion
 */
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      await auth.signOut();
      return {
        success: false,
        error: "Veuillez vérifier votre email avant de vous connecter.",
        code: "email-not-verified"
      };
    }
    
    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    return {
      success: true,
      user: user,
      userData: userData,
      message: "Connexion réussie"
    };
    
  } catch (error) {
    console.error("Erreur de connexion:", error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Déconnecter l'utilisateur
 * @returns {Promise<Object>} - Résultat de la déconnexion
 */
async function logoutUser() {
  try {
    await auth.signOut();
    return {
      success: true,
      message: "Déconnexion réussie"
    };
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Récupérer le mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<Object>} - Résultat de la récupération
 */
async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return {
      success: true,
      message: "Email de réinitialisation envoyé"
    };
  } catch (error) {
    console.error("Erreur de réinitialisation:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Vérifier l'état de l'authentification
 * @returns {Promise<Object>} - État de l'authentification
 */
async function checkAuthState() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Récupérer les données utilisateur
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        resolve({
          isLoggedIn: true,
          user: user,
          userData: userData
        });
      } else {
        resolve({
          isLoggedIn: false,
          user: null,
          userData: null
        });
      }
    });
  });
}

// ==================== FONCTIONS UTILISATEURS ====================

/**
 * Récupérer les données d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Données utilisateur
 */
async function getUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      return {
        success: true,
        data: userDoc.data()
      };
    } else {
      return {
        success: false,
        error: "Utilisateur non trouvé"
      };
    }
  } catch (error) {
    console.error("Erreur de récupération utilisateur:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mettre à jour les données utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} data - Données à mettre à jour
 * @returns {Promise<Object>} - Résultat de la mise à jour
 */
async function updateUserData(userId, data) {
  try {
    await db.collection('users').doc(userId).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: "Données mises à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur de mise à jour utilisateur:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FONCTIONS DE TRANSACTIONS ====================

/**
 * Créer une nouvelle transaction
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} transactionData - Données de la transaction
 * @returns {Promise<Object>} - Résultat de la création
 */
async function createTransaction(userId, transactionData) {
  try {
    const transactionRef = db.collection('transactions').doc();
    const transactionId = transactionRef.id;
    
    const transaction = {
      id: transactionId,
      userId: userId,
      ...transactionData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };
    
    await transactionRef.set(transaction);
    
    // Ajouter la transaction à l'historique utilisateur
    await db.collection('users').doc(userId).update({
      transactions: firebase.firestore.FieldValue.arrayUnion(transactionId),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      transactionId: transactionId,
      message: "Transaction créée avec succès"
    };
  } catch (error) {
    console.error("Erreur de création de transaction:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Créer une nouvelle commande
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} orderData - Données de la commande
 * @returns {Promise<Object>} - Résultat de la création
 */
async function createOrder(userId, orderData) {
  try {
    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    
    const order = {
      id: orderId,
      userId: userId,
      ...orderData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      adminNotes: ''
    };
    
    await orderRef.set(order);
    
    // Ajouter la commande à l'historique utilisateur
    await db.collection('users').doc(userId).update({
      orders: firebase.firestore.FieldValue.arrayUnion(orderId),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Notification admin
    await createNotification({
      userId: 'admin',
      type: 'new_order',
      title: 'Nouvelle commande',
      message: `Nouvelle commande #${orderId} créée`,
      orderId: orderId,
      read: false
    });
    
    return {
      success: true,
      orderId: orderId,
      message: "Commande créée avec succès"
    };
  } catch (error) {
    console.error("Erreur de création de commande:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mettre à jour le statut d'une commande
 * @param {string} orderId - ID de la commande
 * @param {string} status - Nouveau statut
 * @param {string} adminNotes - Notes de l'administrateur
 * @returns {Promise<Object>} - Résultat de la mise à jour
 */
async function updateOrderStatus(orderId, status, adminNotes = '') {
  try {
    await db.collection('orders').doc(orderId).update({
      status: status,
      adminNotes: adminNotes,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      processedAt: status !== 'pending' ? firebase.firestore.FieldValue.serverTimestamp() : null
    });
    
    // Récupérer les infos de la commande pour la notification
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();
    
    // Notification utilisateur
    await createNotification({
      userId: orderData.userId,
      type: 'order_update',
      title: 'Mise à jour de commande',
      message: `Votre commande #${orderId} est maintenant ${status}`,
      orderId: orderId,
      read: false
    });
    
    return {
      success: true,
      message: "Statut de commande mis à jour"
    };
  } catch (error) {
    console.error("Erreur de mise à jour de commande:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FONCTIONS ADMIN ====================

/**
 * Vérifier si l'utilisateur est administrateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} - True si admin
 */
async function isAdmin(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.role === 'admin' || userData.email === 'bmarcco4412@gmail.com';
    }
    
    return false;
  } catch (error) {
    console.error("Erreur de vérification admin:", error);
    return false;
  }
}

/**
 * Récupérer toutes les commandes
 * @param {string} filter - Filtre optionnel
 * @returns {Promise<Array>} - Liste des commandes
 */
async function getAllOrders(filter = 'all') {
  try {
    let query = db.collection('orders').orderBy('createdAt', 'desc');
    
    if (filter !== 'all') {
      query = query.where('status', '==', filter);
    }
    
    const snapshot = await query.get();
    const orders = [];
    
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      orders: orders
    };
  } catch (error) {
    console.error("Erreur de récupération des commandes:", error);
    return {
      success: false,
      error: error.message,
      orders: []
    };
  }
}

/**
 * Récupérer tous les utilisateurs
 * @returns {Promise<Array>} - Liste des utilisateurs
 */
async function getAllUsers() {
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      users: users
    };
  } catch (error) {
    console.error("Erreur de récupération des utilisateurs:", error);
    return {
      success: false,
      error: error.message,
      users: []
    };
  }
}

/**
 * Créditer le solde d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} amount - Montant à créditer
 * @param {string} reason - Raison du crédit
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function creditUserBalance(userId, amount, reason) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentBalance = userData.balance || 0;
    const newBalance = currentBalance + amount;
    
    await db.collection('users').doc(userId).update({
      balance: newBalance,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Créer une transaction
    await createTransaction(userId, {
      type: 'credit',
      amount: amount,
      previousBalance: currentBalance,
      newBalance: newBalance,
      reason: reason,
      method: 'admin_credit'
    });
    
    // Notification utilisateur
    await createNotification({
      userId: userId,
      type: 'balance_update',
      title: 'Solde crédité',
      message: `Votre solde a été crédité de ${amount} HTG. ${reason}`,
      read: false
    });
    
    return {
      success: true,
      newBalance: newBalance,
      message: "Solde crédité avec succès"
    };
  } catch (error) {
    console.error("Erreur de crédit:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FONCTIONS DE NOTIFICATIONS ====================

/**
 * Créer une notification
 * @param {Object} notificationData - Données de la notification
 * @returns {Promise<Object>} - Résultat de la création
 */
async function createNotification(notificationData) {
  try {
    const notificationRef = db.collection('notifications').doc();
    
    const notification = {
      id: notificationRef.id,
      ...notificationData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await notificationRef.set(notification);
    
    // Ajouter à l'utilisateur si spécifié
    if (notificationData.userId && notificationData.userId !== 'admin') {
      await db.collection('users').doc(notificationData.userId).update({
        notifications: firebase.firestore.FieldValue.arrayUnion(notificationRef.id)
      });
    }
    
    return {
      success: true,
      notificationId: notificationRef.id
    };
  } catch (error) {
    console.error("Erreur de création de notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Récupérer les notifications d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des notifications
 */
async function getUserNotifications(userId) {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const notifications = [];
    
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      notifications: notifications
    };
  } catch (error) {
    console.error("Erreur de récupération des notifications:", error);
    return {
      success: false,
      error: error.message,
      notifications: []
    };
  }
}

/**
 * Marquer une notification comme lue
 * @param {string} notificationId - ID de la notification
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function markNotificationAsRead(notificationId) {
  try {
    await db.collection('notifications').doc(notificationId).update({
      read: true
    });
    
    return {
      success: true,
      message: "Notification marquée comme lue"
    };
  } catch (error) {
    console.error("Erreur de mise à jour de notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FONCTIONS DE STATISTIQUES ====================

/**
 * Récupérer les statistiques générales
 * @returns {Promise<Object>} - Statistiques
 */
async function getStatistics() {
  try {
    // Nombre d'utilisateurs
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    // Commandes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', today)
      .get();
    
    const todayOrders = ordersSnapshot.size;
    
    // Revenus du jour
    let todayRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.amount) {
        todayRevenue += order.amount;
      }
    });
    
    // Commandes en attente
    const pendingOrdersSnapshot = await db.collection('orders')
      .where('status', '==', 'pending')
      .get();
    
    const pendingOrders = pendingOrdersSnapshot.size;
    
    return {
      success: true,
      stats: {
        totalUsers: totalUsers,
        todayOrders: todayOrders,
        todayRevenue: todayRevenue,
        pendingOrders: pendingOrders
      }
    };
  } catch (error) {
    console.error("Erreur de récupération des statistiques:", error);
    return {
      success: false,
      error: error.message,
      stats: {}
    };
  }
}

// ==================== UTILITAIRES ====================

/**
 * Formater un montant
 * @param {number} amount - Montant à formater
 * @param {string} currency - Devise (HTG, USD)
 * @returns {string} - Montant formaté
 */
function formatAmount(amount, currency = 'HTG') {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
}

/**
 * Valider un email
 * @param {string} email - Email à valider
 * @returns {boolean} - True si valide
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valider un numéro de téléphone haïtien
 * @param {string} phone - Numéro de téléphone
 * @returns {boolean} - True si valide
 */
function validatePhone(phone) {
  const regex = /^(?:\+509|509|0)(?:3[4-9]|4[0-8]|[58][0-9]|9[0-9])[0-9]{6}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Générer un ID de transaction
 * @returns {string} - ID de transaction
 */
function generateTransactionId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TRX-${timestamp}-${random}`;
}

// ==================== EXPORT DES FONCTIONS ====================

// Vérifier si on est dans un environnement Node.js ou navigateur
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = {
    firebaseConfig,
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    checkAuthState,
    getUserData,
    updateUserData,
    createTransaction,
    createOrder,
    updateOrderStatus,
    isAdmin,
    getAllOrders,
    getAllUsers,
    creditUserBalance,
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    getStatistics,
    formatAmount,
    validateEmail,
    validatePhone,
    generateTransactionId
  };
} else {
  // Navigateur - Ajouter à l'objet window
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;
  
  window.PayFusion = {
    // Configuration
    firebaseConfig,
    
    // Authentification
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    checkAuthState,
    
    // Utilisateurs
    getUserData,
    updateUserData,
    
    // Transactions
    createTransaction,
    createOrder,
    updateOrderStatus,
    
    // Admin
    isAdmin,
    getAllOrders,
    getAllUsers,
    creditUserBalance,
    
    // Notifications
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    
    // Statistiques
    getStatistics,
    
    // Utilitaires
    formatAmount,
    validateEmail,
    validatePhone,
    generateTransactionId
  };
  
  console.log("Pay Fusion Firebase config chargé");
}