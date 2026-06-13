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

        // Fetch last message and unread count
        let lastMessage = '';
        let lastMessageTime = '';
        let unreadCount = 0;
        try {
          const msgQ = query(
            collection(db, 'matches', docSnap.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          const msgSnap = await getDocs(msgQ);
          if (!msgSnap.empty) {
            const lastMsg = msgSnap.docs[0].data();
            lastMessage = lastMsg.text ?? '';
            lastMessageTime = lastMsg.createdAt ?? '';
            // Count unread - messages from other user not yet read
            unreadCount = msgSnap.docs.filter(d => d.data().senderId !== currentUserId && !d.data().read).length;
          }
        } catch {}

        results.push({
          matchId: docSnap.id,
          user: userData,
          lastMessage: lastMessage || 'Say hello! 👋',
          lastMessageTime,
          unread: unreadCount,
        });
      } catch {}
    }

    return results;
  } catch (e) {
    return [];
  }
};
