path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

old = """  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text, borderWidth: 0, // override below
  } as any, inputX: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.text, maxHeight: 100, minHeight: 44 },"""

new = """  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text },"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Fixed')
