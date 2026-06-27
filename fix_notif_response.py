path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add Notifications import
old_import = "import { setupNotificationChannel, sendLocalNotification } from '../services/notifications';"
new_import = """import { setupNotificationChannel, sendLocalNotification } from '../services/notifications';
import * as Notifications from 'expo-notifications';"""
content = content.replace(old_import, new_import)

# Add notification tap handler
old_effect = "  // Listen for incoming calls"
new_effect = """  // Handle notification tap (when app is backgrounded)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'call' && data?.matchId) {
        router.push({
          pathname: `/call/${data.matchId}`,
          params: {
            type: data.callType ?? 'voice',
            callerId: data.callerId,
            callerName: data.callerName,
            channelName: data.channelName,
            isAnswering: 'true',
          }
        } as any);
      }
    });
    return () => sub.remove();
  }, []);

  // Listen for incoming calls"""
content = content.replace(old_effect, new_effect)

with open(path, 'w') as f:
    f.write(content)
print('✅ Notification tap handler added')
