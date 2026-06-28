path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old_init = """    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);

    // Listen for OneSignal subscription change to get player ID
    OneSignal.User.pushSubscription.addEventListener('change', async (change: any) => {
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

new_init = """    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);

    // Save OneSignal ID when subscription changes
    OneSignal.User.pushSubscription.addEventListener('change', async (change: any) => {
      const playerId = change.current?.id ?? change.current?.token;
      if (playerId && user?.id) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId });
          console.log('✅ OneSignal ID saved:', playerId);
        } catch(e) {}
      }
    });

    // Try getting ID after short delay (SDK needs time to register)
    setTimeout(async () => {
      try {
        const subId = (OneSignal.User.pushSubscription as any).id 
          ?? (OneSignal.User.pushSubscription as any).token;
        if (subId && user?.id) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: subId });
          console.log('✅ OneSignal ID saved (delayed):', subId);
        }
      } catch {}
    }, 3000);"""

content = content.replace(old_init, new_init)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal ID saving improved')
