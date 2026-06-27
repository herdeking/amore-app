ONESIGNAL_APP_ID = 'd4895865-ee18-4353-9acc-015c888135cd'

# Add OneSignal to _layout.tsx
path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add import
old_import = "import * as Notifications from 'expo-notifications';"
new_import = """import * as Notifications from 'expo-notifications';
import { OneSignal } from 'react-native-onesignal';"""
content = content.replace(old_import, new_import)

# Add OneSignal init in setup useEffect
old_setup = "    setupNotificationChannel().catch(() => {});"
new_setup = """    setupNotificationChannel().catch(() => {});
    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);"""
content = content.replace(old_setup, new_setup)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal initialized in _layout.tsx')

# Update chat/[id].tsx to also send via OneSignal for calls
chat_path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(chat_path, 'r') as f:
    chat = f.read()

if 'OneSignal' not in chat:
    old_import2 = "import { subscribeToMessages"
    new_import2 = """import { OneSignal } from 'react-native-onesignal';
import { subscribeToMessages"""
    chat = chat.replace(old_import2, new_import2)

    # Add OneSignal push alongside Expo push for calls
    old_expo_push = "      } catch {}\n    });"
    new_expo_push = """      } catch {}

      // Also notify via OneSignal for better background delivery
      try {
        const receiverSnap2 = await getDoc(doc(db, 'users', otherUser?.id ?? ''));
        const osPlayerId = receiverSnap2.data()?.osPlayerId;
        if (osPlayerId) {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic YOUR_REST_API_KEY',
            },
            body: JSON.stringify({
              app_id: 'd4895865-ee18-4353-9acc-015c888135cd',
              include_player_ids: [osPlayerId],
              headings: { en: type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call' },
              contents: { en: `${user?.name} is calling you...` },
              priority: 10,
              data: { type: 'call', callType: type, callerId: user?.id, callerName: user?.name, matchId: id, channelName },
            }),
          });
        }
      } catch {}
    });"""
    chat = chat.replace(old_expo_push, new_expo_push)

    with open(chat_path, 'w') as f:
        f.write(chat)
    print('✅ OneSignal call notification added')

print('\n🎉 OneSignal setup done!')
