// app/follow-list.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getFollowers, getMyFriends } from '../services/followService';
import { getOrCreateMatch } from '../services/swipeService';
import { Colors } from '../constants/colors';

export default function FollowListScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'followers' | 'following' }>();
  const { user } = useAuthStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const data = type === 'followers'
        ? await getFollowers(user.id)
        : await getMyFriends(user.id);
      setList(data);
      setLoading(false);
    };
    load();
  }, [user?.id, type]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : list.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{type === 'followers' ? '👥' : '➕'}</Text>
          <Text style={styles.emptyTitle}>
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={async () => {
              if (!user?.id) return;
              const matchId = await getOrCreateMatch(user.id, item.id);
              router.push(`/chat/${matchId}`);
            }}>
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={{ fontSize: 22 }}>👤</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: item.online ? '#4CAF50' : '#999' }}>
                  {item.online ? '● Online' : 'Offline'}
                </Text>
              </View>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 16, color: '#999' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
});
