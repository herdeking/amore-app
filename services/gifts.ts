import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const GIFTS = [
  { id: 'rose', emoji: '🌹', name: 'Rose', cost: 10, message: 'sent you a Rose! 🌹' },
  { id: 'heart', emoji: '💝', name: 'Heart', cost: 20, message: 'sent you a Heart! 💝' },
  { id: 'diamond', emoji: '💎', name: 'Diamond', cost: 50, message: 'sent you a Diamond! 💎' },
  { id: 'crown', emoji: '👑', name: 'Crown', cost: 100, message: 'sent you a Crown! 👑' },
  { id: 'cake', emoji: '🎂', name: 'Cake', cost: 30, message: 'sent you a Cake! 🎂' },
  { id: 'car', emoji: '🚗', name: 'Car', cost: 200, message: 'sent you a Car! 🚗' },
  { id: 'ring', emoji: '💍', name: 'Ring', cost: 500, message: 'sent you a Ring! 💍' },
  { id: 'teddy', emoji: '🧸', name: 'Teddy', cost: 40, message: 'sent you a Teddy! 🧸' },
];

export const sendGift = async (
  senderId: string,
  receiverId: string,
  giftId: string,
  senderDiamonds: number
) => {
  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) throw new Error('Gift not found');
  if (senderDiamonds < gift.cost) throw new Error(`Not enough diamonds! You need ${gift.cost} 💎`);

  await addDoc(collection(db, 'gifts'), {
    senderId,
    receiverId,
    giftId,
    giftEmoji: gift.emoji,
    giftName: gift.name,
    cost: gift.cost,
    createdAt: new Date().toISOString(),
  });

  return gift;
};

export const getReceivedGifts = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'gifts'),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};
