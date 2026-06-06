import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

const DEMO_MATCHES = [
  { id: '1', name: 'Amara', photo: 'https://randomuser.me/api/portraits/women/1.jpg', lastMessage: 'Hey! How are you? 😊', time: '2m ago', unread: 2, online: true },
  { id: '2', name: 'Chioma', photo: 'https://randomuser.me/api/portraits/women/2.jpg', lastMessage: 'Would love to meet up!', time: '15m ago', unread: 1, online: true },
  { id: '3', name: 'Fatima', photo: 'https://randomuser.me/api/portraits/women/3.jpg', lastMessage: 'You look great in your photos', time: '1h ago', unread: 0, online: false },
  { id: '4', name: 'Ngozi', photo: 'https://randomuser.me/api/portraits/women/4.jpg', lastMessage: 'Haha that is so funny 😂', time: '2h ago', unread: 0, online: true },
  { id: '5', name: 'Blessing', photo: 'https://randomuser.me/api/portraits/women/5.jpg', lastMessage: 'What do you do for fun?', time: '3h ago', unread: 0, online: false },
  { id: '6', name: 'Adaeze', photo: 'https://randomuser.me/api/portraits/women/6.jpg', lastMessage: 'I love hiking too! 🏔️', time: '5h ago', unread: 0, online: false },
  { id: '7', name: 'Kemi', photo: 'https://randomuser.me/api/portraits/women/7.jpg', lastMessage: 'Can we talk later tonight?', time: '1d ago', unread: 0, online: true },
  { id: '8', name: 'Tolu', photo: 'https://randomuser.me/api/portraits/women/8.jpg', lastMessage: 'Nice to match with you!', time: '1d ago', unread: 0, online: false },
  { id: '9', name: 'Halima', photo: 'https://randomuser.me/api/portraits/women/9.jpg', lastMessage: 'You seem interesting 👀', time: '2d ago', unread: 0, online: false },
  { id: '10', name: 'Uju', photo: 'https://randomuser.me/api/portraits/women/10.jpg', lastMessage: 'Tell me about yourself!', time: '2d ago', unread: 0, online: true },
];

const NEW_MATCHES = DEMO_MATCHES.slice(0, 5);

export default function MatchesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'chats' | 'likes'>('chats');

  const filtered = DEMO_MATCHES.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Matches 💕</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'chats' && styles.tabActive]}
          onPress={() => setTab('chats')}
        >
          <Text style={[styles.tabText, tab === 'chats' && styles.tabTextActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'likes' && styles.tabActive]}
          onPress={() => setTab('likes')}
        >
          <Text style={[styles.tabText, tab === 'likes' && styles.tabTextActive]}>New Matches</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{NEW_MATCHES.length}</Text></View>
        </TouchableOpacity>
      </View>

      {tab === 'likes' ? (
        /* New matches grid */
        <FlatList
          data={NEW_MATCHES}
          numColumns={3}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <Image source={{ uri: item.photo }} style={styles.gridPhoto} />
              {item.online && <View style={styles.onlineDot} />}
              <Text style={styles.gridName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search matches..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Chat list */}
          <FlatList
            data={filtered}
            keyExtractor={m => m.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatRow}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
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
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.primary },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 18 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.surface, gap: 6 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: Theme.fontWeight.semibold, color: Colors.textLight },
  tabTextActive: { color: Colors.white },
  badge: { backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 11, color: Colors.primary, fontWeight: Theme.fontWeight.bold },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: Colors.text },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineDotChat: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  chatTime: { fontSize: 12, color: Colors.textLight },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatMsg: { flex: 1, fontSize: 14, color: Colors.textLight },
  unreadBadge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { fontSize: 11, color: Colors.white, fontWeight: Theme.fontWeight.bold },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 88 },
  grid: { padding: 16, gap: 12 },
  gridItem: { flex: 1, alignItems: 'center', margin: 4, position: 'relative' },
  gridPhoto: { width: 100, height: 120, borderRadius: 16, marginBottom: 6 },
  onlineDot: { position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white },
  gridName: { fontSize: 13, fontWeight: Theme.fontWeight.semibold, color: Colors.text },
});
