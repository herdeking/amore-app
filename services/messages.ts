import {
  collection, addDoc, query,
  orderBy, onSnapshot, serverTimestamp, updateDoc, doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Message } from '../types';

export const sendMessage = async (matchId: string, senderId: string, text: string) => {
  await addDoc(collection(db, 'matches', matchId, 'messages'), {
    matchId,
    senderId,
    text,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToMessages = (
  matchId: string,
  cb: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, 'matches', matchId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
  });
};

export const markAsRead = async (matchId: string, messageId: string) => {
  await updateDoc(doc(db, 'matches', matchId, 'messages', messageId), { read: true });
};
