path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old_init = """    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);"""

new_init = """    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);
    // Save OneSignal Player ID to Firestore
    OneSignal.User.getOnesignalId().then(async (playerId) => {
      if (playerId && user?.id) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId }).catch(() => {});
      }
    }).catch(() => {});"""

content = content.replace(old_init, new_init)

with open(path, 'w') as f:
    f.write(content)
print('✅ OneSignal Player ID saving added')
