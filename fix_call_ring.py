chat_path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(chat_path, 'r') as f:
    content = f.read()

old_push = """              body: JSON.stringify({
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
            }),"""

new_push = """              body: JSON.stringify({
              to: pushToken,
              title: type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
              body: `${user?.name} is calling you... Tap to answer`,
              sound: 'default',
              priority: 'high',
              ttl: 30,
              expiration: 30,
              channelId: 'calls',
              android: {
                channelId: 'calls',
                priority: 'max',
                sound: 'default',
                vibrate: [0, 500, 200, 500, 200, 500],
                sticky: false,
                actions: [
                  { identifier: 'decline', buttonTitle: '❌ Decline', isDestructive: true },
                  { identifier: 'accept', buttonTitle: '✅ Accept' },
                ],
              },
              data: {
                type: 'call',
                callType: type,
                callerId: user?.id,
                callerName: user?.name,
                matchId: id,
                channelName,
              },
            }),"""

content = content.replace(old_push, new_push)

with open(chat_path, 'w') as f:
    f.write(content)
print('✅ Call push notification enhanced')
