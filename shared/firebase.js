// GalliExpress — Firebase Configuration
// Replace values below with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDnDaIxKTjKjtlrWVL5-0Um8zRC57pUKD8",
  authDomain: "galliexpress-94098.firebaseapp.com",
  projectId: "galliexpress-94098",
  storageBucket: "galliexpress-94098.firebasestorage.app",
  messagingSenderId: "144220669906",
  appId: "1:144220669906:android:dee6108d265ffd90726a0b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// ─── Firestore Collections ────────────────────────────────────────────────────
// users/           → customer profiles
// partners/        → shop/restaurant profiles
// riders/          → rider profiles
// shops/           → shop listings (public)
// menuItems/       → items per shop
// orders/          → all orders
// categories/      → food, grocery, vegetables etc.
// addresses/       → saved customer addresses
// earnings/        → rider & partner earnings logs
// notifications/   → push notification queue
