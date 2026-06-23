path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/profile.tsx'
with open(path, 'r') as f:
    content = f.read()

old_verify = """            Alert.alert(
              'Get Verified ✅',
              'Take a selfie matching a pose to verify your identity. Verified profiles get 3x more matches!',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Verify Now', onPress: async () => {
                  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                  if (!result.canceled && user) {
                    Alert.alert('Submitted! ✅', 'Your verification photo has been submitted. We will review it within 24 hours.');
                  }
                }}
              ]
            );"""

new_verify = """Alert.alert(
              'Get Verified ✅',
              'Take a selfie to verify your identity. Verified profiles get 3x more matches!',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Selfie', onPress: async () => {
                  try {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert('Permission needed', 'Camera access is required for verification.');
                      return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                      quality: 0.8,
                      allowsEditing: true,
                      aspect: [1, 1],
                    });
                    if (!result.canceled && result.assets?.[0] && user) {
                      setSaving(true);
                      try {
                        const url = await uploadToCloudinary(result.assets[0].uri);
                        await updateDoc(doc(db, 'users', user.id), {
                          verificationPhoto: url,
                          verificationStatus: 'pending',
                          verificationSubmittedAt: new Date().toISOString(),
                        });
                        // Also create admin review doc
                        const { addDoc, collection: col } = await import('firebase/firestore');
                        await addDoc(col(db, 'verificationRequests'), {
                          userId: user.id,
                          userName: user.name,
                          userPhoto: user.photos?.[0] ?? '',
                          verificationPhoto: url,
                          status: 'pending',
                          submittedAt: new Date().toISOString(),
                        });
                        setUser({ ...user, verificationStatus: 'pending' } as any);
                        Alert.alert('Submitted! ✅', 'Your selfie has been submitted. We will review it within 24 hours. You will be notified once approved.');
                      } catch (e: any) {
                        Alert.alert('Upload failed', e.message);
                      } finally {
                        setSaving(false);
                      }
                    }
                  } catch (e: any) {
                    Alert.alert('Error', e.message);
                  }
                }}
              ]
            );"""

content = content.replace(old_verify, new_verify)

# Update the button label to show pending state
old_label = """          <Text style={styles.menuIcon}>{user?.isVerified ? '✅' : '🔵'}</Text>
            <Text style={styles.menuText}>{user?.isVerified ? 'Verified ✅' : 'Get Verified'}</Text>"""

new_label = """          <Text style={styles.menuIcon}>
              {user?.isVerified ? '✅' : (user as any)?.verificationStatus === 'pending' ? '⏳' : '🔵'}
            </Text>
            <Text style={styles.menuText}>
              {user?.isVerified ? 'Verified ✅' : (user as any)?.verificationStatus === 'pending' ? 'Verification Pending...' : 'Get Verified'}
            </Text>"""

content = content.replace(old_label, new_label)

# Also block resubmission if pending
old_already = """            if (user?.isVerified) {
              Alert.alert('Already Verified ✅', 'Your profile is verified!');
              return;
            }"""

new_already = """            if (user?.isVerified) {
              Alert.alert('Already Verified ✅', 'Your profile is verified!');
              return;
            }
            if ((user as any)?.verificationStatus === 'pending') {
              Alert.alert('Under Review ⏳', 'Your verification is being reviewed. We will notify you within 24 hours.');
              return;
            }"""

content = content.replace(old_already, new_already)

with open(path, 'w') as f:
    f.write(content)
print('✅ profile.tsx verification updated')

# ── Show verified badge on swipe cards (already has isVerified check) ──
# Check swipe.tsx already shows verifiedBadge — it does from our earlier read
# Just ensure the badge style is visible
swipe_path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/swipe.tsx'
with open(swipe_path, 'r') as f:
    sc = f.read()

if 'verifiedBadge' not in sc:
    print('⚠️  No verifiedBadge style in swipe.tsx — may need manual check')
else:
    print('✅ swipe.tsx already shows verified badge')

print('\n🎉 Verified badge done!')
