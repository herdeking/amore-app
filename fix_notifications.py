import re

# ── Fix 1: notifications.ts — add Android channel with MAX importance ──
notif_path = '/data/data/com.termux/files/home/amore-app/services/notifications.ts'
with open(notif_path, 'r') as f:
    content = f.read()

old = """Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});"""

new = """Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const setupNotificationChannel = async () => {
  if (require('react-native').Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF4B6E',
    sound: 'default',
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync('calls', {
    name: 'Calls',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#FF4B6E',
    sound: 'default',
    showBadge: true,
  });
};

export const sendLocalNotification = async (title: string, body: string, channelId: string = 'messages') => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(require('react-native').Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
};"""

# Remove old sendLocalNotification since we're replacing it above
content = content.replace(old, new)
content = re.sub(
    r"export const sendLocalNotification = async.*?\};\n",
    '',
    content,
    flags=re.DOTALL
)

with open(notif_path, 'w') as f:
    f.write(content)
print('✅ notifications.ts updated')

# ── Fix 2: _layout.tsx — setup channel + heads-up notification for calls ──
layout_path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(layout_path, 'r') as f:
    content = f.read()

# Add import
old_import = "import { useAuth } from '../hooks/useAuth';"
new_import = """import { useAuth } from '../hooks/useAuth';
import { setupNotificationChannel, sendLocalNotification } from '../services/notifications';"""
content = content.replace(old_import, new_import)

# Add channel setup + call notification in useEffect
old_effect = "  // Listen for incoming calls\n  useEffect(() => {"
new_effect = """  // Setup notification channels on mount
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  // Listen for incoming calls
  useEffect(() => {"""
content = content.replace(old_effect, new_effect)

# Add heads-up notification when call arrives
old_alert = "      if (!snap.exists()) return;\n      const data = snap.data();\n      Alert.alert("
new_alert = """      if (!snap.exists()) return;
      const data = snap.data();
      // Show heads-up notification so it appears even when app is backgrounded
      sendLocalNotification(
        data.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        `${data.callerName} is calling you...`,
        'calls'
      );
      Alert.alert("""
content = content.replace(old_alert, new_alert)

with open(layout_path, 'w') as f:
    f.write(content)
print('✅ _layout.tsx updated')

# ── Fix 3: chat/[id].tsx — use otherUser name for notification, not matchName ──
chat_path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(chat_path, 'r') as f:
    content = f.read()

old_notif = "        if (newest.senderId !== user?.id) {\n          sendLocalNotification(`${matchName} 💬`, newest.text);\n        }"
new_notif = """        if (newest.senderId !== user?.id) {
          // Use otherUser.name directly — matchName may still be 'User' if not loaded yet
          const senderName = otherUser?.name ?? 'New message';
          sendLocalNotification(`${senderName} 💬`, newest.text, 'messages');
        }"""
content = content.replace(old_notif, new_notif)

with open(chat_path, 'w') as f:
    f.write(content)
print('✅ chat/[id].tsx updated')

print('\n🎉 All notification fixes applied!')
