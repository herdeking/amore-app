import { db } from './firebase';
import { increment, updateDoc, doc } from 'firebase/firestore';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const recordProfileView = async (viewerId: string, profileId: string) => {
  if (viewerId === profileId) return;
  try {
    await addDoc(collection(db, 'profileViews'), {
      viewerId,
      profileId,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {}
};

export const getProfileViewers = async (userId: string, isPremium: boolean) => {
  try {
    const q = query(
      collection(db, 'profileViews'),
      where('profileId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(isPremium ? 100 : 3)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};
