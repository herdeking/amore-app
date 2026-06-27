ONESIGNAL_REST_KEY = 'os_v2_app_2sevqzpodbbvhgwmafoirajvzwqwgrnp62ueabesc3aqfu2uus6idqps3d7wyvkrjoqzxqkddvjefeo2et3x5lgoaohmtu2dll73i4q'

path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

content = content.replace(
    "'Authorization': 'Basic YOUR_REST_API_KEY'",
    f"'Authorization': 'Basic {ONESIGNAL_REST_KEY}'"
)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal REST key added')
