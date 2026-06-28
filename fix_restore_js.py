import os

# ── 1. Restore ratingService.ts ──
rating_service = '''\
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';

const MATCH_COUNT_KEY = 'amore_match_count';
const RATING_DONE_KEY = 'amore_rating_done';
const RATING_THRESHOLD = 5;

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.herdeking.amoreapp';

export const incrementMatchCount = async (): Promise<void> => {
  try {
    const done = await AsyncStorage.getItem(RATING_DONE_KEY);
    if (done === 'true') return;
    const current = await AsyncStorage.getItem(MATCH_COUNT_KEY);
    const count = current ? parseInt(current) + 1 : 1;
    await AsyncStorage.setItem(MATCH_COUNT_KEY, String(count));
  } catch {}
};

export const checkAndShowRatingPrompt = async (): Promise<void> => {
  try {
    const done = await AsyncStorage.getItem(RATING_DONE_KEY);
    if (done === 'true') return;
    const current = await AsyncStorage.getItem(MATCH_COUNT_KEY);
    const count = current ? parseInt(current) : 0;
    if (count >= RATING_THRESHOLD) {
      setTimeout(() => {
        Alert.alert(
          'Enjoying Amore? 💕',
          `You have made ${count} matches! We would love to hear what you think.`,
          [
            {
              text: 'Rate Us',
              onPress: async () => {
                await AsyncStorage.setItem(RATING_DONE_KEY, 'true');
                Linking.openURL(PLAY_STORE_URL).catch(() => {});
              },
            },
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: async () => {
                await AsyncStorage.setItem(MATCH_COUNT_KEY, '0');
              },
            },
            {
              text: 'Never Ask Again',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.setItem(RATING_DONE_KEY, 'true');
              },
            },
          ]
        );
      }, 2000);
    }
  } catch {}
};
'''
with open('/data/data/com.termux/files/home/amore-app/services/ratingService.ts', 'w') as f:
    f.write(rating_service)
print('✅ ratingService.ts restored')

# ── 2. Restore anniversaryService.ts ──
anniversary_service = '''\
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendExpoPush, sendOneSignalPush } from './notifications';

export const checkMatchAnniversaries = async (userId: string, userName: string) => {
  try {
    const q = query(collection(db, 'matches'), where('users', 'array-contains', userId));
    const snap = await getDocs(q);
    const now = new Date();

    for (const d of snap.docs) {
      const data = d.data();
      if (!data.createdAt) continue;
      const createdAt = new Date(data.createdAt);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const otherId = (data.users as string[]).find((id: string) => id !== userId);
      if (!otherId) continue;

      if (diffDays === 7 || diffDays === 30 || diffDays === 365) {
        const label = diffDays === 7 ? '1 week' : diffDays === 30 ? '1 month' : '1 year';
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const otherSnap = await getDoc(doc(db, 'users', otherId));
          const pushToken = otherSnap.data()?.pushToken;
          const osPlayerId = otherSnap.data()?.osPlayerId;
          const title = `${label} Anniversary! 🎉`;
          const body = `You and ${userName} have been matched for ${label}!`;
          if (pushToken) sendExpoPush(pushToken, title, body);
          if (osPlayerId) sendOneSignalPush(osPlayerId, title, body);
        } catch {}
      }
    }
  } catch {}
};
'''
with open('/data/data/com.termux/files/home/amore-app/services/anniversaryService.ts', 'w') as f:
    f.write(anniversary_service)
print('✅ anniversaryService.ts restored')

# ── 3. Add back to useSwipe.ts for rating ──
swipe_hook = '/data/data/com.termux/files/home/amore-app/hooks/useSwipe.ts'
with open(swipe_hook, 'r') as f:
    content = f.read()

if 'ratingService' not in content:
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith('import'):
            last_import = i
    lines.insert(last_import + 1, "import { incrementMatchCount, checkAndShowRatingPrompt } from '../services/ratingService';")
    content = '\n'.join(lines)

    old_match = "    if (result.matched) {\n      const matchedProfile = profiles.find(p => p.id === id);\n      if (matchedProfile) {\n        setMatchedUser(matchedProfile);"
    new_match = """    if (result.matched) {
      const matchedProfile = profiles.find(p => p.id === id);
      if (matchedProfile) {
        setMatchedUser(matchedProfile);
        incrementMatchCount().then(() => checkAndShowRatingPrompt()).catch(() => {});"""
    content = content.replace(old_match, new_match)

    with open(swipe_hook, 'w') as f:
        f.write(content)
    print('✅ Rating prompt added back to useSwipe.ts')

# ── 4. Add anniversary check to useAuth.ts ──
auth_hook = '/data/data/com.termux/files/home/amore-app/hooks/useAuth.ts'
with open(auth_hook, 'r') as f:
    content = f.read()

if 'anniversaryService' not in content:
    content = content.replace(
        "import { checkAndShowNotifications } from '../services/notificationActivity';",
        "import { checkAndShowNotifications } from '../services/notificationActivity';\nimport { checkMatchAnniversaries } from '../services/anniversaryService';"
    )
    content = content.replace(
        "checkAndShowNotifications(firebaseUser.uid).catch(() => {});",
        "checkAndShowNotifications(firebaseUser.uid).catch(() => {});\n            checkMatchAnniversaries(firebaseUser.uid, firebaseUser.displayName ?? 'Someone').catch(() => {});"
    )
    with open(auth_hook, 'w') as f:
        f.write(content)
    print('✅ Anniversary check added to useAuth.ts')

print('\n🎉 Pure JS features restored!')
