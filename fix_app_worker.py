import re

# Fix notifications.ts
path1 = 'services/notifications.ts'
with open(path1, 'r') as f:
    content = f.read()

old1 = "await fetch('https://onesignal.com/api/v1/notifications', {"
new1 = "await fetch('https://amore-push-proxy.herdeking.workers.dev/', {"
content = content.replace(old1, new1)

# Remove Authorization header since worker adds it
old_auth1 = "        'Authorization': 'Basic os_v2_app_2sevqzpodbbvhgwmafoirajvzwqwgrnp62ueabesc3aqfu2uus6idqps3d7wyvkrjoqzxqkddvjefeo2et3x5lgoaohmtu2dll73i4q',\n"
content = content.replace(old_auth1, "")

with open(path1, 'w') as f:
    f.write(content)
print("✅ notifications.ts updated:", old1 not in content)

# Fix chat/[id].tsx
path2 = 'app/chat/[id].tsx'
with open(path2, 'r') as f:
    content2 = f.read()

old2 = "await fetch('https://onesignal.com/api/v1/notifications', {"
new2 = "await fetch('https://amore-push-proxy.herdeking.workers.dev/', {"
content2 = content2.replace(old2, new2)

# Remove Authorization header
content2 = re.sub(r"\s*'Authorization': 'Basic os_v2_app[^']*',\n", "\n", content2)

with open(path2, 'w') as f:
    f.write(content2)
print("✅ chat/[id].tsx updated:", old2 not in content2)
