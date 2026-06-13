import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc } from 'firebase/firestore';
import { createNotification } from './notificationActivity';
import { User, Match, SwipeAction } from '../types';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export const fetchProfiles = async (currentUserId: string): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    const me = allUsers.find(u => u.id === currentUserId);

    // Get blocked user IDs
    let blockedIds: string[] = [];
    try {
      const reportsQ = query(
        collection(db, 'reports'),
        where('reporterId', '==', currentUserId),
        where('reason', '==', 'blocked')
      );
      const reportsSnap = await getDocs(reportsQ);
      blockedIds = reportsSnap.docs.map(d => d.data().reportedId);
    } catch {}

    let filtered = allUsers.filter(u =>
      u.id !== currentUserId &&
      (u.photos?.length ?? 0) > 0 &&
      !blockedIds.includes(u.id)
    );

    // Sort by distance if both users have coordinates
    if (me?.latitude && me?.longitude) {
      filtered = filtered.sort((a, b) => {
        const distA = (a.latitude && a.longitude)
          ? calculateDistance(me.latitude!, me.longitude!, a.latitude, a.longitude)
          : Infinity;
        const distB = (b.latitude && b.longitude)
          ? calculateDistance(me.latitude!, me.longitude!, b.latitude, b.longitude)
          : Infinity;
        return distA - distB;
      });
    }

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

      // Notify the other user about the match
      try {
        const meSnap = await getDoc(doc(db, 'users', action.userId));
        const myName = meSnap.exists() ? (meSnap.data().name ?? 'Someone') : 'Someone';
        await createNotification(action.targetId, 'match', myName);
      } catch {}

      return { matched: true, matchId: matchRef.id };
    } else {
      // Notify target about the like (not a match yet)
      try {
        const meSnap = await getDoc(doc(db, 'users', action.userId));
        const myName = meSnap.exists() ? (meSnap.data().name ?? 'Someone') : 'Someone';
        await createNotification(action.targetId, 'like', myName);
      } catch {}
    }
    return { matched: false };
  } catch (e) {
    return { matched: false };
  }
};

export const getOrCreateMatch = async (userId: string, targetId: string): Promise<string> => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', userId)
    );
    const snap = await getDocs(q);
    const existing = snap.docs.find(d => (d.data().users as string[]).includes(targetId));
    if (existing) return existing.id;

    const matchRef = await addDoc(collection(db, 'matches'), {
      users: [userId, targetId],
      createdAt: new Date().toISOString(),
    });
    return matchRef.id;
  } catch (e) {
    return targetId;
  }
};
