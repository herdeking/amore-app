import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { user, firebaseUid, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!firebaseUid) {
      router.replace('/(auth)/login');
    } else if (!user || !user.name) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/swipe');
    }
  }, [isLoading, firebaseUid, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#FF4B6E" />
    </View>
  );
}
