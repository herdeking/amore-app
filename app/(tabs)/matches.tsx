import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, TextInput, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import AdBanner from '../../components/AdBanner';
import { useAuthStore } from '../../store/authStore';
import { fetchMatches, MatchWithUser } from '../../services/matchesService';
import { getMyFriends } from '../../services/followService';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Stories from '../../components/stories/Stories';

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"messages" | "friends" | "calls">("messages");
  const [realMatches, setRealMatches] = useState<MatchWithUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);

  const combinedMatches = realMatches.map(m => ({
    id: m.matchId,
    name: m.user.name || 'Unknown',
    photo: m.user.photos?.[0] ?? 'https://randomuser.me/api/portraits/lego/1.jpg',
    lastMessage: m.lastMessage ?? 'Say hello! 👋',
    time: m.lastMessageTime ? new Date(m.lastMessageTime).toLocaleDateString() : 'New match',
    unread: m.unread,
    online: false,
  }));

  const loadMatches = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const m = await fetchMatches(user.id);
    setRealMatches(m);
    setLoading(false);
  }, [user?.id]);

  const loadFriends = useCallback(async () => {
    if (!user?.id) return;
    const f = await getMyFriends(user.id);
    setFriends(f);
  }, [user?.id]);

  const loadCallHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const q = query(
        collection(db, 'callHistory'),
        where('participants', 'array-contains', user.id),
        limit(30)
      );
      const snap = await getDocs(q);
      const calls = snap.docs.map(d => {
        const data = d.data();
        const isOutgoing = data.callerId === user.id;
        return {
          id: d.id,
          name: isOutgoing ? (data.receiverName ?? 'Unknown') : (data.callerName ?? 'Unknown'),
          otherId: isOutgoing ? data.receiverId : data.callerId,
          type: data.type ?? 'voice',
          status: isOutgoing ? 'outgoing' : 'incoming',
          duration: data.duration ?? 0,
          time: data.startedAt ? new Date(data.startedAt).toLocaleString() : '',
        };
      });
      calls.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setCallHistory(calls);
    } catch (e) {
      console.log('loadCallHistory error:', e);
    }
  }, [user?.id]);

  useEffect(() => { loadMatches(); }, [user?.id]);

  useFocusEffect(useCallback(() => {
    loadMatches();
    loadFriends();
    loadCallHistory();
  }, [loadMatches, loadFriends, loadCallHistory]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMatches(), loadFriends(), loadCallHistory()]);
    setRefreshing(false);
  };

  const filtered = combinedMatches.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCallDuration = (secs: number) => {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages 💕</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      <Stories currentUser={user} />
      <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "messages" && styles.tabActive]} onPress={() => setTab("messages")}>
          <Text style={[styles.tabText, tab === "messages" && styles.tabTextActive]}>Messages</Text>
          {combinedMatches.filter(m => m.unread > 0).length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{combinedMatches.filter(m => m.unread > 0).length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "friends" && styles.tabActive]} onPress={() => setTab("friends")}>
          <Text style={[styles.tabText, tab === "friends" && styles.tabTextActive]}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "calls" && styles.tabActive]} onPress={() => setTab("calls")}>
          <Text style={[styles.tabText, tab === "calls" && styles.tabTextActive]}>Calls</Text>
        </TouchableOpacity>
      </View>

      {tab === "messages" && (
        <>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <FlatList
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💕</Text>
                  <Text style={styles.emptyTitle}>No matches yet</Text>
                  <Text style={styles.emptySub}>Start swiping to find your match!</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/swipe' as any)}>
                    <Text style={styles.emptyBtnText}>Start Swiping →</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            data={filtered}
            keyExtractor={m => m.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.chatRow} onPress={() => router.push(`/chat/${item.id}`)}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: item.photo }} style={styles.avatar} />
                  {item.online && <View style={styles.onlineDotChat} />}
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTop}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.chatTime}>{item.time}</Text>
                  </View>
                  <View style={styles.chatBottom}>
                    <Text style={styles.chatMsg} numberOfLines={1}>{item.lastMessage}</Text>
                    {item.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          />
        </>
      )}

      {tab === "friends" && (
        <FlatList
          data={friends}
          keyExtractor={f => f.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySub}>Follow people from their profile to see them here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.photo }} style={styles.avatar} />
                {item.online && <View style={styles.onlineDotChat} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: item.online ? '#4CAF50' : Colors.textLight }}>
                  {item.online ? '● Online' : 'Offline'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.friendBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {tab === "calls" && (
        <FlatList
          data={callHistory}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📞</Text>
              <Text style={styles.emptyTitle}>No call history</Text>
              <Text style={styles.emptySub}>Calls you make or receive will show here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.callRow}>
              <View style={[styles.avatar, styles.callAvatarPlaceholder]}>
                <Text style={{ fontSize: 22 }}>{item.type === 'video' ? '📹' : '📞'}</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: Colors.textLight }}>
                  {item.status === "incoming" ? "↙ Incoming" : "↗ Outgoing"} {item.type === "video" ? "📹" : "📞"} · {item.time}
                </Text>
                {item.duration ? <Text style={{ fontSize: 11, color: Colors.textLight }}>Duration: {formatCallDuration(item.duration)}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.friendBtn, { backgroundColor: "#f0f0f0" }]}
                onPress={() => Alert.alert("Call Back", `Call ${item.name}?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "📞 Voice", onPress: () => router.push({ pathname: `/call/${item.otherId}`, params: { type: 'voice', callerId: user?.id, callerName: user?.name, receiverId: item.otherId, receiverName: item.name, channelName: `call_${item.otherId}_${Date.now()}` }} as any) },
                  { text: "📹 Video", onPress: () => router.push({ pathname: `/call/${item.otherId}`, params: { type: 'video', callerId: user?.id, callerName: user?.name, receiverId: item.otherId, receiverName: item.name, channelName: `call_${item.otherId}_${Date.now()}` }} as any) },
                ])}
              >
                <Text style={{ fontSize: 18 }}>{item.type === "video" ? "📹" : "📞"}</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.primary },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  filterIcon: { fontSize: 18 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 8, borderRadius: 20, backgroundColor: Colors.surface, gap: 4 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.textLight },
  tabTextActive: { color: Colors.white },
  badge: { backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 10, color: Colors.primary, fontWeight: Theme.fontWeight.bold },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: Colors.text },
  chatRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  friendRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  callRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  avatarContainer: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  callAvatarPlaceholder: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  onlineDotChat: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: "#4CAF50", borderWidth: 2, borderColor: Colors.white },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  chatTime: { fontSize: 12, color: Colors.textLight },
  chatBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatMsg: { flex: 1, fontSize: 14, color: Colors.textLight },
  unreadBadge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  unreadText: { fontSize: 11, color: Colors.white, fontWeight: Theme.fontWeight.bold },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 20 },
  friendBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  emptyState: { alignItems: 'center' as const, justifyContent: 'center' as const, padding: 48, gap: 12, flex: 1 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#333' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center' as const },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' as const, fontSize: 15 },
});
