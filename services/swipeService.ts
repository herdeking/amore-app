import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc } from 'firebase/firestore';
import { User, Match, SwipeAction } from '../types';

export const fetchProfiles = async (currentUserId: string): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    console.log('Total users in Firestore:', allUsers.length);
    const filtered = allUsers.filter(u => u.id !== currentUserId && (u.photos?.length ?? 0) > 0);
    console.log('Users with photos (excluding self):', filtered.length);
    return filtered;
  } catch (e) {
    return [];
  }
};

export const recordSwipe = async (action: SwipeAction): Promise<{ matched: boolean; matchId?: string }> => {
  try {
    await addDoc(collection(db, 'swipes'), {
      ...action,
      createdAt: new Date().toISOString(),
    });

    if (action.action === 'pass') return { matched: false };

    const q = query(
      collection(db, 'swipes'),
      where('userId', '==', action.targetId),
      where('targetId', '==', action.userId),
      where('action', 'in', ['like', 'superlike'])
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const matchRef = await addDoc(collection(db, 'matches'), {
        users: [action.userId, action.targetId],
        createdAt: new Date().toISOString(),
      });
      return { matched: true, matchId: matchRef.id };
    }
    return { matched: false };
  } catch (e) {
    return { matched: false };
  }
};
