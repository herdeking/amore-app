path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/matches.tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix friends Message button to get/create match first
old = """                onPress={() => router.push(`/chat/${item.id}`)}
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Message</Text>"""

new = """                onPress={async () => {
                  if (!user?.id) return;
                  const { getOrCreateMatch } = await import('../../services/swipeService');
                  const matchId = await getOrCreateMatch(user.id, item.id);
                  router.push(`/chat/${matchId}`);
                }}
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Message</Text>"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Friends chat navigation fixed')
