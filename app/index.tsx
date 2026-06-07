import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const router = useRouter();
  const { user, firebaseUid, isLoading } = useAuthStore();
  useAuth();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (!firebaseUid) {
        router.replace('/(auth)/login');
      } else if (!user?.name) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/swipe');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, firebaseUid, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#FF4B6E" />
    </View>
  );
}
