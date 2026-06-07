import { rtdb, auth } from './firebase';
import { ref, set, onDisconnect, serverTimestamp, onValue, off } from 'firebase/database';

export const goOnline = (userId: string) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  set(presenceRef, {
    isOnline: true,
    lastSeen: serverTimestamp(),
  });
  onDisconnect(presenceRef).set({
    isOnline: false,
    lastSeen: serverTimestamp(),
  });
};

export const goOffline = (userId: string) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  set(presenceRef, {
    isOnline: false,
    lastSeen: serverTimestamp(),
  });
};

export const watchPresence = (
  userId: string,
  callback: (isOnline: boolean) => void
) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);
  onValue(presenceRef, snap => {
    const data = snap.val();
    callback(data?.isOnline ?? false);
  });
  return () => off(presenceRef);
};
