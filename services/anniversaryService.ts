import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendExpoPush, sendOneSignalPush } from './notifications';

export const checkMatchAnniversaries = async (userId: string, userName: string) => {
  try {
    const q = query(collection(db, 'matches'), where('users', 'array-contains', userId));
    const snap = await getDocs(q);
    const now = new Date();

    for (const d of snap.docs) {
      const data = d.data();
      if (!data.createdAt) continue;
      const createdAt = new Date(data.createdAt);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const otherId = (data.users as string[]).find((id: string) => id !== userId);
      if (!otherId) continue;

      if (diffDays === 7 || diffDays === 30 || diffDays === 365) {
        const label = diffDays === 7 ? '1 week' : diffDays === 30 ? '1 month' : '1 year';
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const otherSnap = await getDoc(doc(db, 'users', otherId));
          const pushToken = otherSnap.data()?.pushToken;
          const osPlayerId = otherSnap.data()?.osPlayerId;
          const title = `${label} Anniversary! 🎉`;
          const body = `You and ${userName} have been matched for ${label}!`;
          if (pushToken) sendExpoPush(pushToken, title, body);
          if (osPlayerId) sendOneSignalPush(osPlayerId, title, body);
        } catch {}
      }
    }
  } catch {}
};
