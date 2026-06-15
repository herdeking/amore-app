import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  // Live unread messages count
  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, snap => setNotifCount(snap.size));
    return () => unsub();
  }, [user?.id]);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FF4B6E',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        height: 60 + bottom,
        paddingBottom: bottom + 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10,
        shadowOpacity: 0.1,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
      },
      tabBarIconStyle: {
        marginTop: 4,
      },
    }}>
      <Tabs.Screen name="swipe" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={26} color={color} /> }} />
      <Tabs.Screen name="likes" options={{ title: 'Likes', tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={26} color={color} /> }} />
      <Tabs.Screen name="video" options={{ title: 'Video', tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={26} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Messages', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={26} color={color} />, tabBarBadge: unreadCount > 0 ? unreadCount : undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={26} color={color} /> }} />
    </Tabs>
  );
}
