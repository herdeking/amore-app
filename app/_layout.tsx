import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="chat/[id]"
        options={{ headerShown: true, title: '' }}
      />
    </Stack>
  );
}
