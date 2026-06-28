ONESIGNAL_APP_ID = 'd4895865-ee18-4353-9acc-015c888135cd'
ONESIGNAL_KEY = 'os_v2_app_2sevqzpodbbvhgwmafoirajvzwqwgrnp62ueabesc3aqfu2uus6idqps3d7wyvkrjoqzxqkddvjefeo2et3x5lgoaohmtu2dll73i4q'

# Add OneSignal backup to notifications.ts
notif_path = '/data/data/com.termux/files/home/amore-app/services/notifications.ts'
with open(notif_path, 'r') as f:
    content = f.read()

if 'sendOneSignalPush' not in content:
    content += f"""
export const sendOneSignalPush = async (
  osPlayerId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) => {{
  if (!osPlayerId) return;
  try {{
    await fetch('https://onesignal.com/api/v1/notifications', {{
      method: 'POST',
      headers: {{
        'Content-Type': 'application/json',
        'Authorization': 'Basic {ONESIGNAL_KEY}',
      }},
      body: JSON.stringify({{
        app_id: '{ONESIGNAL_APP_ID}',
        include_player_ids: [osPlayerId],
        headings: {{ en: title }},
        contents: {{ en: body }},
        priority: 10,
        data: data ?? {{}},
        android_channel_id: data?.channelId === 'calls' ? 'calls' : 'messages',
      }}),
    }});
  }} catch (e) {{
    console.log('OneSignal push failed:', e);
  }}
}};
"""
    with open(notif_path, 'w') as f:
        f.write(content)
    print('✅ sendOneSignalPush added to notifications.ts')

# Add OneSignal backup to chatService.ts
chat_service = '/data/data/com.termux/files/home/amore-app/services/chatService.ts'
with open(chat_service, 'r') as f:
    chat = f.read()

if 'sendOneSignalPush' not in chat:
    chat = chat.replace(
        "import { sendExpoPush } from './notifications';",
        "import { sendExpoPush, sendOneSignalPush } from './notifications';"
    )
    chat = chat.replace(
        "if (pushToken) sendExpoPush(pushToken, `${senderName} 💬`, text, { channelId: 'messages', matchId });",
        """if (pushToken) sendExpoPush(pushToken, `${senderName} 💬`, text, { channelId: 'messages', matchId });
      // OneSignal backup
      const osPlayerId = userSnap.data()?.osPlayerId;
      if (osPlayerId) sendOneSignalPush(osPlayerId, `${senderName} 💬`, text, { channelId: 'messages', matchId });"""
    )
    with open(chat_service, 'w') as f:
        f.write(chat)
    print('✅ OneSignal backup added to chatService')

# Add OneSignal backup to swipeService.ts for match notifications
swipe_service = '/data/data/com.termux/files/home/amore-app/services/swipeService.ts'
with open(swipe_service, 'r') as f:
    swipe = f.read()

if 'sendOneSignalPush' not in swipe:
    swipe = swipe.replace(
        "import { sendExpoPush } from './notifications';",
        "import { sendExpoPush, sendOneSignalPush } from './notifications';"
    )
    swipe = swipe.replace(
        "if (pushToken) sendExpoPush(pushToken, \"It's a Match! 🎉\", `You and ${myName} liked each other!`, { channelId: 'messages', type: 'match' });",
        """if (pushToken) sendExpoPush(pushToken, "It's a Match! 🎉", `You and ${myName} liked each other!`, { channelId: 'messages', type: 'match' });
        const osPlayerId = targetSnap.data()?.osPlayerId;
        if (osPlayerId) sendOneSignalPush(osPlayerId, "It's a Match! 🎉", `You and ${myName} liked each other!`, { channelId: 'messages', type: 'match' });"""
    )
    with open(swipe_service, 'w') as f:
        f.write(swipe)
    print('✅ OneSignal backup added to swipeService')

print('\n🎉 Dual push (Expo + OneSignal) implemented for all notifications!')
