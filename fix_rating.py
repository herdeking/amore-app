import os

# ── 1. Create ratingService.ts ──
rating_service = '''\
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';

const MATCH_COUNT_KEY = 'amore_match_count';
const RATING_DONE_KEY = 'amore_rating_done';
const RATING_THRESHOLD = 5;

// App store URLs - update with your actual app IDs
const APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_APP_ID';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amore.app';

export const incrementMatchCount = async (): Promise<void> => {
  try {
    const done = await AsyncStorage.getItem(RATING_DONE_KEY);
    if (done === 'true') return; // already rated, stop counting

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
      // Small delay so match celebration finishes first
      setTimeout(() => {
        Alert.alert(
          '💕 Enjoying Amore?',
          `You've made ${count} matches! We'd love to hear what you think.`,
          [
            {
              text: '⭐ Rate Us',
              onPress: async () => {
                await AsyncStorage.setItem(RATING_DONE_KEY, 'true');
                const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
                Linking.openURL(url).catch(() => {});
              },
            },
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: async () => {
                // Reset count so it asks again after 5 more matches
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
print('✅ ratingService.ts created')

# ── 2. Hook into useSwipe.ts when match is detected ──
swipe_path = '/data/data/com.termux/files/home/amore-app/hooks/useSwipe.ts'
with open(swipe_path, 'r') as f:
    content = f.read()

# Add import at top
old_import = "import { db } from '../services/firebase';" if "import { db } from '../services/firebase';" in content else "import {"
first_import_line = content.split('\n')[0]

# Find a safe place to add import - after last import line
import_insert = "import { incrementMatchCount, checkAndShowRatingPrompt } from '../services/ratingService';"
if 'ratingService' not in content:
    # Add after first import block
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    lines.insert(last_import_idx + 1, import_insert)
    content = '\n'.join(lines)

# Add rating calls when match is detected
old_match = "    if (result.matched) {\n      const matchedProfile = profiles.find(p => p.id === id);\n      if (matchedProfile) {\n        setMatchedUser(matchedProfile);"
new_match = """    if (result.matched) {
      const matchedProfile = profiles.find(p => p.id === id);
      if (matchedProfile) {
        setMatchedUser(matchedProfile);
        // Track match count for rating prompt
        incrementMatchCount().then(() => checkAndShowRatingPrompt()).catch(() => {});"""
content = content.replace(old_match, new_match)

with open(swipe_path, 'w') as f:
    f.write(content)
print('✅ useSwipe.ts updated with rating trigger')

print('\n🎉 App rating prompt done!')
