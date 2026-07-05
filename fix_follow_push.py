path = 'services/followService.ts'
with open(path, 'r') as f:
    content = f.read()

old_import = "import { db } from './firebase';"
new_import = """import { db } from './firebase';
import { sendExpoPush, sendOneSignalPush } from './notifications';"""
content = content.replace(old_import, new_import)

old_notif = """  await setDoc(doc(collection(db, 'notifications')), {
    userId: followedId,
    type: 'follow',
    fromUserId: followerId,
    fromUserName: followerName,
    message: `${followerName} started following you`,
    read: false,
    createdAt: new Date().toISOString(),
  });
};"""

new_notif = """  await setDoc(doc(collection(db, 'notifications')), {
    userId: followedId,
    type: 'follow',
    fromUserId: followerId,
    fromUserName: followerName,
    message: `${followerName} started following you`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Send push notification
  try {
    const followedSnap = await getDoc(doc(db, 'users', followedId));
    const followed = followedSnap.data();
    const title = 'New Follower 👥';
    const body = `${followerName} started following you!`;
    if (followed?.pushToken) sendExpoPush(followed.pushToken, title, body, { channelId: 'messages', type: 'follow' });
    if (followed?.osPlayerId) sendOneSignalPush(followed.osPlayerId, title, body, { channelId: 'messages', type: 'follow' });
  } catch {}
};"""

content = content.replace(old_notif, new_notif)

with open(path, 'w') as f:
    f.write(content)
print("✅ Follow push notification added:", old_notif not in content)
