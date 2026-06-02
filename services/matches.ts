import {
  doc, setDoc, collection, query,
  where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Match, SwipeAction } from '../types';

export const recordSwipe = async (action: SwipeAction) => {
  const id = `${action.userId}_${action.targetId}`;
  await setDoc(doc(db, 'swipes', id), action);
};

export const checkMutualLike = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  const id = `${targetId}_${userId}`;
  const snap = await getDocs(
    query(collection(db, 'swipes'), where('__name__', '==', id), where('action', '==', 'like'))
  );
  return !snap.empty;
};

export const createMatch = async (userId: string, targetId: string): Promise<Match> => {
  const matchId = [userId, targetId].sort().join('_');
  const match: Match = {
    id: matchId,
    users: [userId, targetId],
    createdAt: new Date(),
  };
  await setDoc(doc(db, 'matches', matchId), { ...match, createdAt: serverTimestamp() });
  return match;
};

export const fetchMatches = async (userId: string): Promise<Match[]> => {
  const snap = await getDocs(
    query(collection(db, 'matches'), where('users', 'array-contains', userId))
  );
  return snap.docs.map(d => d.data() as Match);
};
