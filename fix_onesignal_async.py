path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """    // Also try to get current subscription ID immediately
    try {
      const subId = OneSignal.User.pushSubscription.id;
      if (subId && user?.id) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        updateDoc(doc(db, 'users', user.id), { osPlayerId: subId }).catch(() => {});
      }
    } catch {}"""

new = """    // Also try to get current subscription ID immediately
    (async () => {
      try {
        const subId = (OneSignal.User.pushSubscription as any).token ?? (OneSignal.User.pushSubscription as any).optedIn;
        if (user?.id) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          if (subId) updateDoc(doc(db, 'users', user.id), { osPlayerId: subId }).catch(() => {});
        }
      } catch {}
    })();"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Fixed async')
