import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { setupNotificationChannel, sendLocalNotification } from '../services/notifications';
import * as Notifications from 'expo-notifications';
import { OneSignal } from 'react-native-onesignal';
import { useAuthStore } from '../store/authStore';
import { db } from '../services/firebase';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';

export default function RootLayout() {
  useAuth();
  const { user } = useAuthStore();
  const router = useRouter();

  // Setup notification channels and OneSignal on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    // Initialize OneSignal
    OneSignal.initialize('d4895865-ee18-4353-9acc-015c888135cd');
    OneSignal.Notifications.requestPermission(true);

    // Listen for OneSignal subscription change to get player ID
    OneSignal.User.pushSubscription.addEventListener('change', async (change: any) => {
      const playerId = change.current?.id;
      if (playerId && user?.id) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          await updateDoc(doc(db, 'users', user.id), { osPlayerId: playerId });
        } catch(e) {}
      }
    });
    // Also try to get current subscription ID immediately
    (async () => {
      try {
        const subId = (OneSignal.User.pushSubscription as any).token ?? (OneSignal.User.pushSubscription as any).optedIn;
        if (user?.id) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          if (subId) updateDoc(doc(db, 'users', user.id), { osPlayerId: subId }).catch(() => {});
        }
      } catch {}
    })();
  }, [user?.id]);

  // Handle notification tap (when app is backgrounded)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'call' && data?.matchId) {
        router.push({
          pathname: `/call/${data.matchId}`,
          params: {
            type: data.callType ?? 'voice',
            callerId: data.callerId,
            callerName: data.callerName,
            channelName: data.channelName,
            isAnswering: 'true',
          }
        } as any);
      }
    });
    return () => sub.remove();
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'callInvites', user.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      sendLocalNotification(
        data.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        `${data.callerName} is calling you...`
      ).catch(() => {});
      Alert.alert(
        data.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        `${data.callerName} is calling you...`,
        [
          {
            text: '❌ Decline',
            style: 'destructive',
            onPress: async () => {
              await deleteDoc(doc(db, 'callInvites', user.id));
            }
          },
          {
            text: '✅ Accept',
            onPress: async () => {
              await deleteDoc(doc(db, 'callInvites', user.id));
              router.push({
                pathname: `/call/${data.matchId ?? data.callId}`,
                params: {
                  type: data.type,
                  callerId: data.callerId,
                  callerName: data.callerName,
                  receiverId: data.receiverId ?? user?.id,
                  receiverName: data.receiverName ?? user?.name,
                  channelName: data.channelName ?? data.callId,
                  isAnswering: 'true',
                }
              } as any);
            }
          }
        ]
      );
    });
    return () => unsub();
  }, [user?.id]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="call/[id]" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
