import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { user, firebaseUid, isLoading } = useAuthStore();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || !waited) return;

    if (!firebaseUid) {
      router.replace('/(auth)/login');
    } else if (user && (user.name || (user.photos && user.photos.length > 0))) {
      // Existing user with data - go to main app
      router.replace('/(tabs)/swipe');
    } else if (user && !user.name && (!user.photos || user.photos.length === 0)) {
      // Truly new user - go to onboarding
      router.replace('/onboarding');
    } else if (firebaseUid && !user) {
      // Firebase auth exists but user data still loading - wait more
      router.replace('/(tabs)/swipe');
    }
  }, [isLoading, waited, firebaseUid, user]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#FF4B6E" />
    </View>
  );
}
