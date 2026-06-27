path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/matches.tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix friends Message button
old = """              <TouchableOpacity
                style={[styles.friendBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Message</Text>
              </TouchableOpacity>"""

new = """              <TouchableOpacity
                style={[styles.friendBtn, { backgroundColor: Colors.primary }]}
                onPress={async () => {
                  if (!user?.id) return;
                  try {
                    const { getOrCreateMatch } = await import('../../services/swipeService');
                    const matchId = await getOrCreateMatch(user.id, item.id);
                    router.push(`/chat/${matchId}`);
                  } catch {
                    router.push(`/chat/${item.id}`);
                  }
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Message</Text>
              </TouchableOpacity>"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Friends Message button fixed')
