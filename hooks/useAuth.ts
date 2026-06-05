import { useEffect } from 'react';
import { onAuthChange, getProfile } from '../services/auth';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { setUser, setFirebaseUid, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser: any) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        const profile = await getProfile(firebaseUser.uid);
        setUser(profile as any);
      } else {
        setUser(null);
        setFirebaseUid(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);
};
