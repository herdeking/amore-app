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
