import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FF4B6E',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { height: 80, paddingBottom: 20, paddingTop: 4 },
    }}>
      <Tabs.Screen name="swipe" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} /> }} />
      <Tabs.Screen name="likes" options={{ title: 'Likes', tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} /> }} />
      <Tabs.Screen name="video" options={{ title: 'Video', tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Messages', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />, tabBarBadge: 17 }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }} />
    </Tabs>
  );
}
