import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, TextInput, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import AdBanner from '../../components/AdBanner';
import { useAuthStore } from '../../store/authStore';
import { fetchMatches, MatchWithUser } from '../../services/matchesService';
import { useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import Stories from '../../components/stories/Stories';

const DEMO_MATCHES = [
  { id: '1', name: 'Amara', photo: 'https://randomuser.me/api/portraits/women/1.jpg', lastMessage: 'Hey! How are you? 😊', time: '2m ago', unread: 0, online: true },
  { id: '2', name: 'Chioma', photo: 'https://randomuser.me/api/portraits/women/2.jpg', lastMessage: 'Would love to meet up!', time: '15m ago', unread: 0, online: true },
  { id: '3', name: 'Fatima', photo: 'https://randomuser.me/api/portraits/women/3.jpg', lastMessage: 'You look great in your photos', time: '1h ago', unread: 0, online: false },
  { id: '4', name: 'Ngozi', photo: 'https://randomuser.me/api/portraits/women/4.jpg', lastMessage: 'Haha that is so funny 😂', time: '2h ago', unread: 0, online: true },
  { id: '5', name: 'Blessing', photo: 'https://randomuser.me/api/portraits/women/5.jpg', lastMessage: 'What do you do for fun?', time: '3h ago', unread: 0, online: false },
  { id: '6', name: 'Adaeze', photo: 'https://randomuser.me/api/portraits/women/6.jpg', lastMessage: 'I love hiking too! 🏔️', time: '5h ago', unread: 0, online: false },
  { id: '7', name: 'Kemi', photo: 'https://randomuser.me/api/portraits/women/7.jpg', lastMessage: 'Can we talk later tonight?', time: '1d ago', unread: 0, online: true },
  { id: '8', name: 'Tolu', photo: 'https://randomuser.me/api/portraits/women/8.jpg', lastMessage: 'Nice to match with you!', time: '1d ago', unread: 0, online: false },
];

const DEMO_FRIENDS = [
  { id: 'f1', name: 'Halima', photo: 'https://randomuser.me/api/portraits/women/9.jpg', mutual: 3, online: true },
  { id: 'f2', name: 'Uju', photo: 'https://randomuser.me/api/portraits/women/10.jpg', mutual: 1, online: false },
  { id: 'f3', name: 'Sade', photo: 'https://randomuser.me/api/portraits/women/11.jpg', mutual: 5, online: true },
  { id: 'f4', name: 'Ini', photo: 'https://randomuser.me/api/portraits/women/12.jpg', mutual: 2, online: false },
];

const DEMO_CALLS = [
  { id: 'c1', name: 'Amara', photo: 'https://randomuser.me/api/portraits/women/1.jpg', type: 'video', status: 'missed', time: '06-07 07:12', duration: '' },
  { id: 'c2', name: 'Chioma', photo: 'https://randomuser.me/api/portraits/women/2.jpg', type: 'voice', status: 'incoming', time: '06-06 14:30', duration: '5:23' },
  { id: 'c3', name: 'Fatima', photo: 'https://randomuser.me/api/portraits/women/3.jpg', type: 'video', status: 'outgoing', time: '06-05 20:15', duration: '12:04' },
];

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"messages" | "friends" | "calls">("messages");
  const [realMatches, setRealMatches] = useState<MatchWithUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);



  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches(user?.id ?? '').then(setRealMatches);
    setRefreshing(false);
  };

  const combinedMatches = [
    ...realMatches.map(m => ({
      id: m.matchId,
      name: m.user.name || 'Unknown',
      photo: m.user.photos?.[0] ?? 'https://randomuser.me/api/portraits/lego/1.jpg',
      lastMessage: m.lastMessage ?? 'Say hello! 👋',
      time: m.lastMessageTime ? new Date(m.lastMessageTime).toLocaleDateString() : 'New match',
      unread: m.unread,
      online: false,
    })),
    ...DEMO_MATCHES,
  ];

  const [loading, setLoading] = useState(true);

  const loadMatches = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const m = await fetchMatches(user.id);
    setRealMatches(m);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadMatches(); }, [user?.id]);

  // Refresh unread counts every time user comes back to this screen
  useFocusEffect(React.useCallback(() => {
    loadMatches();
  }, [loadMatches]));

  const filtered = combinedMatches.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages 💕</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Stories */}
      <Stories currentUser={user} />
      <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />

      {/* Tabs */}
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
          data={DEMO_FRIENDS}
          keyExtractor={f => f.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.photo }} style={styles.avatar} />
                {item.online && <View style={styles.onlineDotChat} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: Colors.textLight }}>{item.mutual} mutual friends</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.friendBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => router.push(`/chat/${item.id}`)}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {tab === "calls" && (
        <FlatList
          data={DEMO_CALLS}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.callRow}>
              <Image source={{ uri: item.photo }} style={styles.avatar} />
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: item.status === "missed" ? Colors.primary : Colors.textLight }}>
                  {item.status === "missed" ? "↗ Missed" : item.status === "incoming" ? "↙ Incoming" : "↗ Outgoing"} {item.type === "video" ? "📹" : "📞"} · {item.time}
                </Text>
                {item.duration ? <Text style={{ fontSize: 11, color: Colors.textLight }}>Duration: {item.duration}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.friendBtn, { backgroundColor: "#f0f0f0" }]}
                onPress={() => Alert.alert("Call Back", `Call ${item.name}?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "📞 Call", onPress: () => Alert.alert("Calling...", "VIP feature - upgrade for unlimited calls!") }
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
});
