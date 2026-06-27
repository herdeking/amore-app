path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """  // Setup notification channels on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);
    // Save OneSignal Player ID to Firestore
    OneSignal.User.getOnesignalId().then(async (playerId) => {
      if (playerId && user?.id) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId }).catch(() => {});
      }
    }).catch(() => {});
  }, []);"""

new = """  // Setup notification channels and OneSignal on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);

    // Listen for OneSignal subscription change to get player ID
    const listener = OneSignal.User.pushSubscription.addEventListener('change', async (change) => {
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
    return () => listener.remove();
  }, [user?.id]);"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal properly initialized')
