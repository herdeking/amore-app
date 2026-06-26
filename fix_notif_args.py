path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """      sendLocalNotification(
        data.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        `${data.callerName} is calling you...`,
        'calls'
      ).catch(() => {});"""
new = """      sendLocalNotification(
        data.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        `${data.callerName} is calling you...`
      ).catch(() => {});"""
content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Fixed')
