import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './firebase';

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
