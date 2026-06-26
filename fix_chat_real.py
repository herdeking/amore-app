path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix isRealMatch - remove length check, just check it's not a demo ID
old = "  const isRealMatch = typeof id === 'string' && !/^d\\d+$/.test(id) && id.length >= 15;"
new = "  const isRealMatch = typeof id === 'string' && !/^d\\d+$/.test(id) && id.length >= 10;"
content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ isRealMatch check fixed')
