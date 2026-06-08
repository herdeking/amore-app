import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { user, firebaseUid, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!firebaseUid) {
        router.replace('/(auth)/login');
      } else if (!user?.name || user?.name === '') {
        // Only send to onboarding if truly new user (no name AND no photos)
        if (!user?.photos || user?.photos?.length === 0) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)/swipe');
        }
      } else {
        router.replace('/(tabs)/swipe');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading, firebaseUid, user?.name]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#FF4B6E" />
    </View>
  );
}
