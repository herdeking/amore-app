// app/notifications.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { Colors } from '../constants/colors';

interface Notification {
  id: string;
  type: string;
  message: string;
  fromUserName?: string;
  read: boolean;
  createdAt: string;
}

const getNotifIcon = (type: string) => {
  switch(type) {
    case 'like': return { icon: 'heart', color: '#FF4B6E' };
    case 'match': return { icon: 'heart-circle', color: '#FF4B6E' };
    case 'message': return { icon: 'chatbubble', color: '#4FC3F7' };
    case 'profile_view': return { icon: 'eye', color: '#9C27B0' };
    case 'visit': return { icon: 'footsteps', color: '#FF9800' };
    case 'follow': return { icon: 'person-add', color: '#4CAF50' };
    default: return { icon: 'notifications', color: Colors.primary };
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
  };

  useEffect(() => {
    markAllRead();
  }, [notifications.length]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>We will notify you of likes, matches and messages</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const { icon, color } = getNotifIcon(item.type);
            return (
              <TouchableOpacity
                style={[styles.row, !item.read && styles.unread]}
                onPress={() => updateDoc(doc(db, 'notifications', item.id), { read: true })}
              >
                <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon as any} size={22} color={color} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.time}>{fmt(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  markRead: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  empty: { textAlign: 'center', padding: 40, color: '#999' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 32 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 12 },
  unread: { backgroundColor: '#FFF5F7' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  message: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', marginBottom: 3 },
  time: { fontSize: 12, color: '#999' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
