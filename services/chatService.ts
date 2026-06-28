import { sendExpoPush, sendOneSignalPush } from './notifications';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
}

export const subscribeToMessages = (
  matchId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(db, 'matches', matchId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
    callback(msgs);
  }, () => {
    callback([]);
  });
};

export const sendMessage = async (matchId: string, senderId: string, text: string) => {
  // Get other user's push token
  try {
    const { getDoc, doc: fsDoc } = await import('firebase/firestore');
    const { db: fdb } = await import('./firebase');
    const matchSnap = await getDoc(fsDoc(fdb, 'matches', matchId));
    const users = matchSnap.data()?.users ?? [];
    const otherId = users.find((u: string) => u !== senderId);
    if (otherId) {
      const userSnap = await getDoc(fsDoc(fdb, 'users', otherId));
      const pushToken = userSnap.data()?.pushToken;
      const senderSnap = await getDoc(fsDoc(fdb, 'users', senderId));
      const senderName = senderSnap.data()?.name ?? 'Someone';
      if (pushToken) sendExpoPush(pushToken, `${senderName} 💬`, text, { channelId: 'messages', matchId });
      // OneSignal backup
      const osPlayerId = userSnap.data()?.osPlayerId;
      if (osPlayerId) sendOneSignalPush(osPlayerId, `${senderName} 💬`, text, { channelId: 'messages', matchId });
    }
  } catch {}
  await addDoc(collection(db, 'matches', matchId, 'messages'), {
    text,
    senderId,
    createdAt: new Date().toISOString(),
    read: false,
  });
};

export const getOtherUserInMatch = async (matchId: string, currentUserId: string) => {
  const matchSnap = await getDoc(doc(db, 'matches', matchId));
  if (!matchSnap.exists()) return null;
  const data = matchSnap.data();
  const otherUserId = (data.users as string[]).find((id: string) => id !== currentUserId);
  if (!otherUserId) return null;
  const userSnap = await getDoc(doc(db, 'users', otherUserId));
  if (!userSnap.exists()) return null;
  return { id: otherUserId, ...userSnap.data() } as any;
};
