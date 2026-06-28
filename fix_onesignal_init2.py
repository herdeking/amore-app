path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """  // Setup notification channels and OneSignal on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    // Initialize OneSignal
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
    }, 3000);
  }, [user?.id]);"""

new = """  // Initialize OneSignal once on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);
  }, []);

  // Save OneSignal player ID when user is logged in
  useEffect(() => {
    if (!user?.id) return;
    const saveOsId = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const subId = (OneSignal.User.pushSubscription as any).id
          ?? (OneSignal.User.pushSubscription as any).token
          ?? (OneSignal.User.pushSubscription as any).optedIn;
        if (subId && typeof subId === 'string') {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: subId });
          console.log('✅ OneSignal ID saved:', subId);
        }
      } catch(e) { console.log('OneSignal save error:', e); }
    };
    saveOsId();

    // Also listen for subscription changes
    OneSignal.User.pushSubscription.addEventListener('change', async (change: any) => {
      const playerId = change.current?.id ?? change.current?.token;
      if (playerId && typeof playerId === 'string') {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId });
          console.log('✅ OneSignal ID updated:', playerId);
        } catch(e) {}
      }
    });
  }, [user?.id]);"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal init fixed')
