# Add notification channel setup and call notification to _layout.tsx
# WITHOUT adding useTheme, analytics, or ErrorBoundary

path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add notification imports
old_import = "import { useAuth } from '../hooks/useAuth';"
new_import = """import { useAuth } from '../hooks/useAuth';
import { setupNotificationChannel, sendLocalNotification } from '../services/notifications';"""
content = content.replace(old_import, new_import)

# Add channel setup on mount
old_effect = "  // Listen for incoming calls"
new_effect = """  // Setup notification channels on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
  }, []);

  // Listen for incoming calls"""
content = content.replace(old_effect, new_effect)

# Add heads-up notification when call arrives
old_alert = "      const data = snap.data();\n      Alert.alert("
new_alert = """      const data = snap.data();
      sendLocalNotification(
        data.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        `${data.callerName} is calling you...`,
        'calls'
      ).catch(() => {});
      Alert.alert("""
content = content.replace(old_alert, new_alert)

with open(path, 'w') as f:
    f.write(content)
print('✅ Notifications added to _layout.tsx safely')
