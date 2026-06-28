import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import { registerForPushNotifications } from '../services/notifications';
import { checkAndShowNotifications } from '../services/notificationActivity';
import { checkMatchAnniversaries } from '../services/anniversaryService';

export const useAuth = () => {
  const { setUser, setFirebaseUid, setLoading, firebaseUid } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        if (firebaseUser) {
          setFirebaseUid(firebaseUser.uid);
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists()) {
              setUser({ id: firebaseUser.uid, ...snap.data() } as any);
            } else {
              setUser({ id: firebaseUser.uid, name: '', photos: [] });
            }
            registerForPushNotifications(firebaseUser.uid).catch(() => {});
            checkAndShowNotifications(firebaseUser.uid).catch(() => {});
            checkMatchAnniversaries(firebaseUser.uid, firebaseUser.displayName ?? 'Someone').catch(() => {});
          } catch {
            setUser({ id: firebaseUser.uid, name: '', photos: [] });
          }
        } else {
          setUser(null);
          setFirebaseUid(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);
};
