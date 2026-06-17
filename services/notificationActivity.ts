import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, limit, updateDoc, doc } from 'firebase/firestore';
import { sendLocalNotification } from './notifications';

const MESSAGES: Record<string, (name: string) => { title: string; body: string }> = {
  follow: (name) => ({ title: 'New Follower 👥', body: `${name} started following you!` }),
  like: (name) => ({ title: 'New Like ❤️', body: `${name} liked your profile!` }),
  match: (name) => ({ title: "It's a Match! 🎉", body: `You matched with ${name}!` }),
};

export const createNotification = async (
  userId: string,
  type: 'follow' | 'like' | 'match' | 'message',
  fromUserName: string,
  fromUserId?: string
) => {
  try {
    const { body: message } = MESSAGES[type] ? MESSAGES[type](fromUserName) : { body: `${fromUserName} sent you a notification` };
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      fromUserId: fromUserId ?? null,
      fromUserName,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      pushSent: false,
    });
  } catch {}
};

export const checkAndShowNotifications = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('pushSent', '==', false),
      limit(10)
    );
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const name = data.fromUserName ?? data.fromName ?? 'Someone';
      const fallback = MESSAGES[data.type] ? MESSAGES[data.type](name) : null;
      const title = fallback?.title ?? 'Amore';
      const body = data.message ?? fallback?.body ?? `${name} sent you a notification`;

      await sendLocalNotification(title, body);
      await updateDoc(doc(db, 'notifications', docSnap.id), { pushSent: true }).catch(() => {});
    }
  } catch {}
};
