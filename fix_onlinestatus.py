path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

# Replace static isOnline/lastSeenText with real-time listener
old_status = """  const isOnline = otherUser?.isOnline ?? false;
  const lastSeenText = isOnline ? '● Online' : otherUser?.lastSeen
    ? `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '● Offline';"""

new_status = """  const [isOnline, setIsOnline] = React.useState(otherUser?.isOnline ?? false);
  const [lastSeen, setLastSeen] = React.useState<string | null>(otherUser?.lastSeen ?? null);

  // Real-time online status listener
  React.useEffect(() => {
    if (!otherUser?.id) return;
    const { doc: fsDoc2, onSnapshot: fsSnap2 } = require('firebase/firestore');
    const unsub = fsSnap2(fsDoc2(db, 'users', otherUser.id), (snap: any) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setIsOnline(data.isOnline ?? false);
      setLastSeen(data.lastSeen ?? null);
    });
    return () => unsub();
  }, [otherUser?.id]);

  // Update current user online/offline status
  React.useEffect(() => {
    if (!user?.id) return;
    const { doc: fsDoc3, updateDoc: fsUpdate3 } = require('firebase/firestore');
    // Mark online on mount
    fsUpdate3(fsDoc3(db, 'users', user.id), {
      isOnline: true,
      lastSeen: new Date().toISOString(),
    }).catch(() => {});
    // Mark offline on unmount
    return () => {
      fsUpdate3(fsDoc3(db, 'users', user.id), {
        isOnline: false,
        lastSeen: new Date().toISOString(),
      }).catch(() => {});
    };
  }, [user?.id]);

  const lastSeenText = isOnline ? '● Online' : lastSeen
    ? `Last seen ${new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '● Offline';"""

content = content.replace(old_status, new_status)

with open(path, 'w') as f:
    f.write(content)
print('✅ Real-time online/offline status done')
