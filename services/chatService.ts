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
  await addDoc(collection(db, 'matches', matchId, 'messages'), {
    text,
    senderId,
    createdAt: new Date().toISOString(),
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
