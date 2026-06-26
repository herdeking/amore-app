import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { setupNotificationChannel, sendLocalNotification } from '../services/notifications';
import { useAuthStore } from '../store/authStore';
import { db } from '../services/firebase';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';

export default function RootLayout() {
  useAuth();
  const { user } = useAuthStore();
  const router = useRouter();

  // Setup notification channels on mount
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
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
