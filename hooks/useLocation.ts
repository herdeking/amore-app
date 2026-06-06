import { useEffect } from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

export const useLocation = () => {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync(loc.coords);
      const locationStr = address.city ?? address.region ?? "Unknown";
      await updateDoc(doc(db, "users", user.id), { location: locationStr });
      setUser({ ...user, location: locationStr });
    })();
  }, [user?.id]);
};
