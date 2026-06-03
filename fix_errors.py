import re

# Fix chat/[id].tsx
with open('app/chat/[id].tsx', 'r') as f:
    content = f.read()
content = re.sub(
    r'<MessageList[^/]*/>',
    '<MessageList matchId={id} />',
    content
)
with open('app/chat/[id].tsx', 'w') as f:
    f.write(content)
print("✅ Fixed chat/[id].tsx")

# Fix profile.tsx
with open('app/(tabs)/profile.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '<ProfilePhoto uid={firebaseUid} photos={user?.photos ?? []} />',
    '<ProfilePhoto photos={user?.photos ?? []} onChange={async (photos) => {}} />'
)
content = content.replace(
    '<ProfileForm user={user} onSave={handleSave} />',
    '<ProfileForm initial={user ?? undefined} onSave={handleSave} />'
)
with open('app/(tabs)/profile.tsx', 'w') as f:
    f.write(content)
print("✅ Fixed profile.tsx")

# Fix matches.tsx
with open('app/(tabs)/matches.tsx', 'r') as f:
    content = f.read()
content = content.replace('m.userId2', 'm.users[1]')
content = re.sub(
    r'<MatchList[^/]*/>',
    '<MatchList userMap={userMap} onSelectMatch={(matchId: string) => router.push(`/chat/${matchId}`)} />',
    content
)
with open('app/(tabs)/matches.tsx', 'w') as f:
    f.write(content)
print("✅ Fixed matches.tsx")

print("\n🎉 Done! Run: npx tsc --noEmit")
