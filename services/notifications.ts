import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotifications = async (userId: string) => {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await updateDoc(doc(db, 'users', userId), { pushToken: token });
  return token;
};

export const sendLocalNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
};

export const setupNotificationChannel = async () => {
  try {
    if (require('react-native').Platform.OS !== 'android') return;
    const { default: Notifs } = await import('expo-notifications');
    await Notifs.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifs.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4B6E',
      sound: 'default',
      showBadge: true,
    });
    await Notifs.setNotificationChannelAsync('calls', {
      name: 'Calls',
      importance: Notifs.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FF4B6E',
      sound: 'default',
      showBadge: true,
    });
  } catch (e) {
    console.log('Channel setup error:', e);
  }
};

export const sendExpoPush = async (pushToken: string, title: string, body: string, data?: Record<string, any>) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        sound: 'default',
        priority: 'high',
        channelId: data?.channelId ?? 'messages',
        data: data ?? {},
      }),
    });
  } catch {}
};
