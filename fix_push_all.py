# Helper function to send Expo push notification
push_helper = '''
export const sendExpoPush = async (pushToken: string, title: string, body: string, data?: Record<string, any>) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        priority: 'high',
        channelId: data?.channelId ?? 'messages',
        data: data ?? {},
      }),
    });
  } catch {}
};
'''

# Add to notifications.ts
notif_path = '/data/data/com.termux/files/home/amore-app/services/notifications.ts'
with open(notif_path, 'r') as f:
    content = f.read()

if 'sendExpoPush' not in content:
    content += push_helper
    with open(notif_path, 'w') as f:
        f.write(content)
    print('✅ sendExpoPush added to notifications.ts')

# Add push to chatService when message is sent
chat_service = '/data/data/com.termux/files/home/amore-app/services/chatService.ts'
with open(chat_service, 'r') as f:
    chat = f.read()

if 'sendExpoPush' not in chat and 'pushToken' not in chat:
    # Find sendMessage function and add push after saving message
    old_send = "export const sendMessage = async ("
    if old_send in chat:
        # Add import
        chat = "import { sendExpoPush } from './notifications';\n" + chat

        # Find where message is added to firestore and send push after
        old_add = "  await addDoc(collection(db, 'matches', matchId, 'messages'), {"
        new_add = """  // Get other user's push token
  try {
    const { getDoc, doc: fsDoc } = await import('firebase/firestore');
    const { db: fdb } = await import('./firebase');
    const matchSnap = await getDoc(fsDoc(fdb, 'matches', matchId));
    const users = matchSnap.data()?.users ?? [];
    const otherId = users.find((u: string) => u !== senderId);
    if (otherId) {
      const userSnap = await getDoc(fsDoc(fdb, 'users', otherId));
      const pushToken = userSnap.data()?.pushToken;
      const senderSnap = await getDoc(fsDoc(fdb, 'users', senderId));
      const senderName = senderSnap.data()?.name ?? 'Someone';
      if (pushToken) sendExpoPush(pushToken, `${senderName} 💬`, text, { channelId: 'messages', matchId });
    }
  } catch {}
  await addDoc(collection(db, 'matches', matchId, 'messages'), {"""
        chat = chat.replace(old_add, new_add)

        with open(chat_service, 'w') as f:
            f.write(chat)
        print('✅ Push notification added to chatService')
    else:
        print('⚠️ Could not find sendMessage in chatService')
else:
    print('ℹ️ Push already in chatService')

# Add push for likes/matches in swipeService
swipe_service = '/data/data/com.termux/files/home/amore-app/services/swipeService.ts'
with open(swipe_service, 'r') as f:
    swipe = f.read()

if 'sendExpoPush' not in swipe:
    swipe = "import { sendExpoPush } from './notifications';\n" + swipe

    # Find where match is created and send push
    old_match = "    if (result.matched) {"
    new_match = """    if (result.matched) {
      // Send push to matched user
      try {
        const { getDoc, doc: matchDoc } = await import('firebase/firestore');
        const { db: fdb } = await import('./firebase');
        const targetSnap = await getDoc(matchDoc(fdb, 'users', targetId));
        const pushToken = targetSnap.data()?.pushToken;
        const currentSnap = await getDoc(matchDoc(fdb, 'users', userId));
        const myName = currentSnap.data()?.name ?? 'Someone';
        if (pushToken) sendExpoPush(pushToken, "It's a Match! 🎉", `You and ${myName} liked each other!`, { channelId: 'messages', type: 'match' });
      } catch {}"""
    swipe = swipe.replace(old_match, new_match)

    with open(swipe_service, 'w') as f:
        f.write(swipe)
    print('✅ Push notification added to swipeService for matches')

print('\n🎉 Push notifications added for calls, messages and matches!')
