path = '/data/data/com.termux/files/home/amore-app/app/onboarding.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add notification tips after onboarding complete
old_complete = "        onboardingComplete: true,"
new_complete = """        onboardingComplete: true,"""

# Find the last step/slide and add notification tip
# Add a notification permission alert after onboarding
if 'notification' not in content.lower():
    old_finish = "        onboardingComplete: true,"
    new_finish = """        onboardingComplete: true,"""
    
    # Find where router.replace happens after onboarding
    old_replace = "router.replace('/(tabs)/swipe')" if "router.replace('/(tabs)/swipe')" in content else None
    
    if old_replace:
        new_replace = """router.replace('/(tabs)/swipe');
        // Show notification setup tip for MIUI/Xiaomi users
        setTimeout(() => {
          const { Alert, Linking } = require('react-native');
          Alert.alert(
            'Enable Notifications 🔔',
            'To receive messages and call alerts, please:\\n\\n1. Go to Settings → Apps → Amore\\n2. Set Battery to "No restrictions"\\n3. Enable Autostart\\n\\nThis ensures you never miss a match!',
            [
              { text: 'Got it!', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }, 1000)"""
        content = content.replace(old_replace, new_replace)
        print('✅ Notification tip added to onboarding')
    else:
        print('⚠️ Could not find router.replace in onboarding')

with open(path, 'w') as f:
    f.write(content)
