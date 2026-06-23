import os

# ── 1. Create analytics service ──
analytics_service = '''\
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from './firebase';

let analytics: any = null;

const getAnalyticsInstance = () => {
  if (!analytics) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.log('Analytics not available:', e);
    }
  }
  return analytics;
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    const a = getAnalyticsInstance();
    if (a) logEvent(a, eventName, params);
  } catch {}
};

export const trackScreen = (screenName: string) => {
  trackEvent('screen_view', { screen_name: screenName });
};

export const trackUser = (userId: string, properties?: Record<string, any>) => {
  try {
    const a = getAnalyticsInstance();
    if (!a) return;
    setUserId(a, userId);
    if (properties) setUserProperties(a, properties);
  } catch {}
};

// Predefined events
export const Analytics = {
  // Auth
  login: () => trackEvent('login', { method: 'email' }),
  signup: () => trackEvent('sign_up', { method: 'email' }),
  logout: () => trackEvent('logout'),

  // Swipe
  swipeLike: (targetId: string) => trackEvent('swipe_like', { target_id: targetId }),
  swipePass: (targetId: string) => trackEvent('swipe_pass', { target_id: targetId }),
  swipeSuperLike: (targetId: string) => trackEvent('swipe_superlike', { target_id: targetId }),
  match: (matchId: string) => trackEvent('match_created', { match_id: matchId }),

  // Chat
  messageSent: (matchId: string) => trackEvent('message_sent', { match_id: matchId }),
  voiceMessageSent: (matchId: string) => trackEvent('voice_message_sent', { match_id: matchId }),
  giftSent: (giftId: string) => trackEvent('gift_sent', { gift_id: giftId }),

  // Calls
  callStarted: (type: string) => trackEvent('call_started', { call_type: type }),
  callAnswered: (type: string) => trackEvent('call_answered', { call_type: type }),

  // Profile
  profileViewed: (targetId: string) => trackEvent('profile_viewed', { target_id: targetId }),
  profileUpdated: (field: string) => trackEvent('profile_updated', { field }),
  photoUploaded: () => trackEvent('photo_uploaded'),

  // Premium
  premiumUpgrade: () => trackEvent('purchase', { item_name: 'premium' }),
  diamondPurchase: (amount: number) => trackEvent('purchase', { item_name: 'diamonds', value: amount }),

  // Engagement
  appRated: () => trackEvent('app_rated'),
  searchPerformed: (term: string) => trackEvent('search', { search_term: term }),
};
'''
with open('/data/data/com.termux/files/home/amore-app/services/analyticsService.ts', 'w') as f:
    f.write(analytics_service)
print('✅ analyticsService.ts created')

# ── 2. Add analytics to firebase.ts ──
firebase_path = '/data/data/com.termux/files/home/amore-app/services/firebase.ts'
with open(firebase_path, 'r') as f:
    content = f.read()

if 'getAnalytics' not in content:
    # Find the export of app
    old_export = 'export { app, auth, db'
    if old_export in content:
        content = content.replace(old_export, 'export { app, auth, db')
    # Add analytics import at bottom
    content += '\n// Analytics initialized lazily in analyticsService.ts\n'
    with open(firebase_path, 'w') as f:
        f.write(content)
    print('✅ firebase.ts noted')
else:
    print('ℹ️ Analytics already in firebase.ts')

# ── 3. Track key events in swipe.tsx ──
swipe_path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/swipe.tsx'
with open(swipe_path, 'r') as f:
    content = f.read()

if 'analyticsService' not in content:
    old_import = "import { calculateMatchScore, getScoreColor, getScoreLabel } from '../../services/matchScore';"
    new_import = """import { calculateMatchScore, getScoreColor, getScoreLabel } from '../../services/matchScore';
import { Analytics } from '../../services/analyticsService';"""
    content = content.replace(old_import, new_import)

    old_haptic = """    // Haptic feedback
    if (action === 'like') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (action === 'superlike') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }"""
    new_haptic = """    // Haptic feedback
    if (action === 'like') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Analytics.swipeLike(target.id);
    } else if (action === 'superlike') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Analytics.swipeSuperLike(target.id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Analytics.swipePass(target.id);
    }"""
    content = content.replace(old_haptic, new_haptic)

    with open(swipe_path, 'w') as f:
        f.write(content)
    print('✅ swipe.tsx analytics added')

# ── 4. Track screen views in _layout.tsx ──
layout_path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(layout_path, 'r') as f:
    content = f.read()

if 'analyticsService' not in content:
    old_import = "import { useTheme } from '../hooks/useTheme';"
    new_import = """import { useTheme } from '../hooks/useTheme';
import { trackUser } from '../services/analyticsService';"""
    content = content.replace(old_import, new_import)

    old_channel = "    setupNotificationChannel();"
    new_channel = """    setupNotificationChannel();
    if (user?.id) trackUser(user.id, { name: user.name ?? '' });"""
    content = content.replace(old_channel, new_channel)

    with open(layout_path, 'w') as f:
        f.write(content)
    print('✅ _layout.tsx analytics added')

print('\n🎉 Firebase Analytics setup done!')
