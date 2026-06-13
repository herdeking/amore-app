import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { sendLocalNotification } from './notifications';

export const createNotification = async (
  userId: string,
  type: 'follow' | 'like' | 'match' | 'message',
  fromName: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      fromName,
      createdAt: new Date().toISOString(),
      read: false,
    });
  } catch {}
};

export const checkAndShowNotifications = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      let title = '';
      let body = '';
      switch (data.type) {
        case 'follow':
          title = 'New Follower 👥';
          body = `${data.fromName} started following you!`;
          break;
        case 'like':
          title = 'New Like ❤️';
          body = `${data.fromName} liked your profile!`;
          break;
        case 'match':
          title = "It's a Match! 🎉";
          body = `You matched with ${data.fromName}!`;
          break;
        default:
          continue;
      }
      await sendLocalNotification(title, body);
      await deleteDoc(doc(db, 'notifications', docSnap.id));
    }
  } catch {}
};
