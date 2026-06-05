import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { setUser, setFirebaseUid, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser(snap.exists() ? { id: firebaseUser.uid, ...snap.data() } as any : null);
      } else {
        setUser(null);
        setFirebaseUid(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);
};
