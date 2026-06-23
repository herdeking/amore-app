// app/search.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { getOrCreateMatch } from '../services/swipeService';
import { Colors } from '../constants/colors';

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('name'),
        startAt(searchText.trim()),
        endAt(searchText.trim() + '')
      );
      const snap = await getDocs(q);
      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.id !== user?.id);
      setResults(users);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.input}
          placeholder="Search by name or user ID..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
        <Text style={styles.searchBtnText}>Search</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : searched && results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySub}>Try a different name</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userRow} onPress={async () => {
              if (!user?.id) return;
              const matchId = await getOrCreateMatch(user.id, item.id);
              router.push(`/chat/${matchId}`);
            }}>
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 22 }}>👤</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
                <Text style={styles.location}>{item.location ?? ''}</Text>
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
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  searchBtn: { marginHorizontal: 16, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySub: { fontSize: 14, color: '#999' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  name: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  location: { fontSize: 12, color: '#999', marginTop: 2 },
});
