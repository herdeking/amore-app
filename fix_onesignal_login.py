path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """  // Save OneSignal player ID when user is logged in
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

new = """  // Link OneSignal to Firebase user
  useEffect(() => {
    if (!user?.id) return;
    try {
      OneSignal.login(user.id);
    } catch(e) {}

    const tryGetOsId = async (attempt: number = 1) => {
      try {
        const sub = OneSignal.User.pushSubscription as any;
        const subId = sub.id ?? sub.token ?? sub.optedInId;
        if (subId && typeof subId === 'string' && subId.length > 5) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: subId, pushToken: subId });
        } else if (attempt < 5) {
          setTimeout(() => tryGetOsId(attempt + 1), attempt * 2000);
        }
      } catch(e) {
        if (attempt < 5) setTimeout(() => tryGetOsId(attempt + 1), attempt * 2000);
      }
    };
    tryGetOsId();

    OneSignal.User.pushSubscription.addEventListener('change', async (change: any) => {
      const playerId = change.current?.id ?? change.current?.token;
      if (playerId && typeof playerId === 'string' && playerId.length > 5) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId, pushToken: playerId });
        } catch(e) {}
      }
    });
  }, [user?.id]);"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal login method added')
