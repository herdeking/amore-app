# Send Expo push notification to receiver when call is initiated
# This works even when app is in background/killed

call_path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(call_path, 'r') as f:
    content = f.read()

old_call = """  const handleCall = (type: 'voice' | 'video') => {
    const channelName = `call_${id}_${Date.now()}`;
    // Save call invite to Firestore so other user gets notified
    import('firebase/firestore').then(({ doc, setDoc }) => {
      setDoc(doc(db, 'callInvites', otherUser?.id ?? ''), {
        callerId: user?.id,
        callerName: user?.name,
        receiverId: otherUser?.id,
        receiverName: matchName,
        channelName,
        type,
        matchId: id,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    });"""

new_call = """  const handleCall = (type: 'voice' | 'video') => {
    const channelName = `call_${id}_${Date.now()}`;
    // Save call invite to Firestore so other user gets notified
    import('firebase/firestore').then(async ({ doc, setDoc, getDoc }) => {
      await setDoc(doc(db, 'callInvites', otherUser?.id ?? ''), {
        callerId: user?.id,
        callerName: user?.name,
        receiverId: otherUser?.id,
        receiverName: matchName,
        channelName,
        type,
        matchId: id,
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      // Send push notification to receiver via Expo Push API
      try {
        const receiverSnap = await getDoc(doc(db, 'users', otherUser?.id ?? ''));
        const pushToken = receiverSnap.data()?.pushToken;
        if (pushToken && pushToken.startsWith('ExponentPushToken')) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: pushToken,
              title: type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
              body: `${user?.name} is calling you...`,
              sound: 'default',
              priority: 'high',
              channelId: 'calls',
              data: {
                type: 'call',
                callType: type,
                callerId: user?.id,
                callerName: user?.name,
                matchId: id,
                channelName,
              },
            }),
          }).catch(() => {});
        }
      } catch {}
    });"""

content = content.replace(old_call, new_call)

with open(call_path, 'w') as f:
    f.write(content)
print('✅ Expo push notification added for calls')
