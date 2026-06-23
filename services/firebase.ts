import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence exists in the React Native build at runtime
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDMEzHwG5NCx-4Sr-rCnFAGrFlWLrLsmOc",
  authDomain: "amore-dating-9b956.firebaseapp.com",
  projectId: "amore-dating-9b956",
  storageBucket: "amore-dating-9b956.firebasestorage.app",
  messagingSenderId: "525255599408",
  appId: "1:525255599408:web:504a867157ddb2879454f5",
  databaseURL: "https://amore-dating-9b956-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance;
try {
  authInstance = initializeAuth(app, {
    // @ts-ignore
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
export default app;

// Analytics initialized lazily in analyticsService.ts
