import re

# Remove key from chat/[id].tsx - use env variable instead
path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

content = content.replace(
    "'Authorization': 'Basic os_v2_app_2sevqzpodbbvhgwmafoirajvzwqwgrnp62ueabesc3aqfu2uus6idqps3d7wyvkrjoqzxqkddvjefeo2et3x5lgoaohmtu2dll73i4q'",
    "'Authorization': `Basic ${process.env.EXPO_PUBLIC_ONESIGNAL_KEY}`"
)

with open(path, 'w') as f:
    f.write(content)
print('✅ Key moved to env variable')

# Remove the fix_onesignal_key.py file with the secret
import os
if os.path.exists('/data/data/com.termux/files/home/amore-app/fix_onesignal_key.py'):
    os.remove('/data/data/com.termux/files/home/amore-app/fix_onesignal_key.py')
    print('✅ fix_onesignal_key.py deleted')
