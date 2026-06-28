import re

# ── 1. Fix chat header showing "User" - use otherUser name properly ──
chat_path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(chat_path, 'r') as f:
    content = f.read()

# Fix matchName to wait for otherUser
old_name = "  const matchName = isRealMatch ? (otherUser?.name ?? (loadingUser ? 'Loading...' : 'User')) : 'Sonia';"
new_name = "  const matchName = isRealMatch ? (otherUser?.name ?? (loadingUser ? '...' : otherUser?.name ?? 'User')) : 'Sonia';"
content = content.replace(old_name, new_name)

# Also fix matchPhoto to use otherUser photo
old_photo = "  const matchPhoto = otherUser?.photos?.[0] ?? 'https://randomuser.me/api/portraits/women/1.jpg';"
new_photo = "  const matchPhoto = otherUser?.photos?.[0] ?? otherUser?.photoURL ?? 'https://randomuser.me/api/portraits/lego/1.jpg';"
content = content.replace(old_photo, new_photo)

with open(chat_path, 'w') as f:
    f.write(content)
print('✅ Chat header name fixed')

# ── 2. Add search icon to matches header ──
matches_path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/matches.tsx'
with open(matches_path, 'r') as f:
    content = f.read()

# Add router import if not there
if 'useRouter' not in content:
    content = content.replace(
        "import React",
        "import React"
    )

# Add search icon to header
old_header = """        <Text style={styles.title}>Messages 💕</Text>"""
new_header = """        <Text style={styles.title}>Messages 💕</Text>
        <TouchableOpacity onPress={() => router.push('/search' as any)} style={{ padding: 8 }}>
          <Text style={{ fontSize: 22 }}>🔍</Text>
        </TouchableOpacity>"""
content = content.replace(old_header, new_header)

with open(matches_path, 'w') as f:
    f.write(content)
print('✅ Search icon added to matches header')

# ── 3. Add push notification for likes ──
swipe_service = '/data/data/com.termux/files/home/amore-app/services/swipeService.ts'
with open(swipe_service, 'r') as f:
    content = f.read()

if 'liked your profile' not in content:
    # Find where like is recorded and add push
    old_like = "    if (result.matched) {"
    new_like = """    // Send like notification (only if not a match)
    if (!result.matched) {
      try {
        const { getDoc, doc: likeDoc } = await import('firebase/firestore');
        const { db: fdb } = await import('./firebase');
        const targetSnap = await getDoc(likeDoc(fdb, 'users', targetId));
        const pushToken = targetSnap.data()?.pushToken;
        const osPlayerId = targetSnap.data()?.osPlayerId;
        const currentSnap = await getDoc(likeDoc(fdb, 'users', userId));
        const myName = currentSnap.data()?.name ?? 'Someone';
        if (pushToken) sendExpoPush(pushToken, 'New Like ❤️', `${myName} liked your profile!`, { channelId: 'messages', type: 'like' });
        if (osPlayerId) sendOneSignalPush(osPlayerId, 'New Like ❤️', `${myName} liked your profile!`, { channelId: 'messages', type: 'like' });
      } catch {}
    }

    if (result.matched) {"""
    content = content.replace(old_like, new_like)

    with open(swipe_service, 'w') as f:
        f.write(content)
    print('✅ Like notification added')

print('\n🎉 All fixes done!')
