import {
  doc, updateDoc, collection,
  query, where, getDocs, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export const updateProfile = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), { ...data });
};

export const fetchProfiles = async (
  currentUser: User,
  excludeIds: string[]
): Promise<User[]> => {
  const q = query(
    collection(db, 'users'),
    where('gender', '==', currentUser.lookingFor === 'both' ? undefined : currentUser.lookingFor),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => d.data() as User)
    .filter(u => u.id !== currentUser.id && !excludeIds.includes(u.id));
};
