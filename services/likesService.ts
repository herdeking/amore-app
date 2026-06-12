import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User } from '../types';

export const fetchWhoLikedMe = async (currentUserId: string): Promise<User[]> => {
  try {
    // Find swipes where someone liked the current user
    const q = query(
      collection(db, 'swipes'),
      where('targetId', '==', currentUserId),
      where('action', 'in', ['like', 'superlike'])
    );
    const snap = await getDocs(q);

    const likerIds = [...new Set(snap.docs.map(d => d.data().userId as string))];

    const users: User[] = [];
    for (const likerId of likerIds) {
      try {
        const userSnap = await getDoc(doc(db, 'users', likerId));
        if (userSnap.exists()) {
          users.push({ id: likerId, ...userSnap.data() } as User);
        }
      } catch {}
    }
    return users;
  } catch (e) {
    return [];
  }
};
