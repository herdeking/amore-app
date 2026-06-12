import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { User } from '../types';

export interface MatchWithUser {
  matchId: string;
  user: User;
  lastMessage?: string;
  lastMessageTime?: string;
  unread: number;
}

export const fetchMatches = async (currentUserId: string): Promise<MatchWithUser[]> => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', currentUserId)
    );
    const snap = await getDocs(q);

    const results: MatchWithUser[] = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const otherUserId = (data.users as string[]).find((id: string) => id !== currentUserId);
      if (!otherUserId) continue;

      try {
        const userSnap = await getDoc(doc(db, 'users', otherUserId));
        if (!userSnap.exists()) continue;

        const userData = { id: otherUserId, ...userSnap.data() } as User;

        // Fetch last message
        let lastMessage = '';
        let lastMessageTime = '';
        try {
          const msgQ = query(
            collection(db, 'matches', docSnap.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const msgSnap = await getDocs(msgQ);
          if (!msgSnap.empty) {
            const msgData = msgSnap.docs[0].data();
            lastMessage = msgData.text ?? '';
            lastMessageTime = msgData.createdAt ?? '';
          }
        } catch {}

        results.push({
          matchId: docSnap.id,
          user: userData,
          lastMessage: lastMessage || 'Say hello! 👋',
          lastMessageTime,
          unread: 0,
        });
      } catch {}
    }

    return results;
  } catch (e) {
    return [];
  }
};
