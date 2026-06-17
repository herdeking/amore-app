// services/followService.ts
import { db } from './firebase';
import {
  doc, setDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, updateDoc, increment
} from 'firebase/firestore';

export const followUser = async (followerId: string, followerName: string, followedId: string) => {
  if (followerId === followedId) return;
  const followId = `${followerId}_${followedId}`;
  const existing = await getDoc(doc(db, 'follows', followId));
  if (existing.exists()) return; // already following

  await setDoc(doc(db, 'follows', followId), {
    followerId,
    followedId,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(doc(db, 'users', followedId), { followersCount: increment(1) }).catch(() => {});
  await updateDoc(doc(db, 'users', followerId), { followingCount: increment(1) }).catch(() => {});

  await setDoc(doc(collection(db, 'notifications')), {
    userId: followedId,
    type: 'follow',
    fromUserId: followerId,
    fromUserName: followerName,
    message: `${followerName} started following you`,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const unfollowUser = async (followerId: string, followedId: string) => {
  const followId = `${followerId}_${followedId}`;
  await deleteDoc(doc(db, 'follows', followId));
  await updateDoc(doc(db, 'users', followedId), { followersCount: increment(-1) }).catch(() => {});
  await updateDoc(doc(db, 'users', followerId), { followingCount: increment(-1) }).catch(() => {});
};

export const isFollowing = async (followerId: string, followedId: string): Promise<boolean> => {
  const followId = `${followerId}_${followedId}`;
  const snap = await getDoc(doc(db, 'follows', followId));
  return snap.exists();
};

export const getMyFriends = async (userId: string) => {
  try {
    const q = query(collection(db, 'follows'), where('followerId', '==', userId));
    const snap = await getDocs(q);
    const friends = await Promise.all(
      snap.docs.map(async d => {
        const followedId = d.data().followedId;
        const uSnap = await getDoc(doc(db, 'users', followedId));
        if (!uSnap.exists()) return null;
        const data = uSnap.data();
        return {
          id: followedId,
          name: data.name ?? 'Unknown',
          photo: data.photos?.[0] ?? '',
          online: data.isOnline ?? false,
        };
      })
    );
    return friends.filter(Boolean);
  } catch (e) {
    console.log('getMyFriends error:', e);
    return [];
  }
};
