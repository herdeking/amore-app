path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """    const listener = OneSignal.User.pushSubscription.addEventListener('change', async (change) => {
      const playerId = change.current?.id;
      if (playerId && user?.id) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId });
          console.log('OneSignal Player ID saved:', playerId);
        } catch(e) { console.log('Failed to save player ID:', e); }
      }
    });
    return () => listener.remove();"""

new = """    OneSignal.User.pushSubscription.addEventListener('change', async (change: any) => {
      const playerId = change.current?.id;
      if (playerId && user?.id) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId });
        } catch(e) {}
      }
    });
    // Also try to get current subscription ID immediately
    try {
      const subId = OneSignal.User.pushSubscription.id;
      if (subId && user?.id) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        updateDoc(doc(db, 'users', user.id), { osPlayerId: subId }).catch(() => {});
      }
    } catch {}"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Fixed')
