import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getProfileViewers } from '../../services/profileViews';
import { fetchWhoLikedMe } from '../../services/likesService';
import { recordSwipe, getOrCreateMatch } from '../../services/swipeService';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export default function LikesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"likes" | "viewers">("likes");
  const isPremium = user?.isPremium ?? false;
  const freeViewLimit = 3;
  const [realLikes, setRealLikes] = useState<any[]>([]);
  const [realViewers, setRealViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [likedUsers, viewers] = await Promise.all([
        fetchWhoLikedMe(user.id),
        getProfileViewers(user.id, isPremium),
      ]);
      setRealLikes(likedUsers.map((u: any) => ({
        id: u.id,
        name: u.name || 'Unknown',
        age: u.age ?? 0,
        photo: u.photos?.[0] ?? '',
        location: u.location ?? '',
      })));
      setRealViewers(viewers.map((v: any) => ({
        id: v.viewerId ?? v.id,
        name: v.viewerName ?? 'Someone',
        age: 0,
        photo: v.viewerPhoto ?? '',
        location: '',
      })));
    } finally {
      setLoading(false);
    }
  }, [user?.id, isPremium]);

  useEffect(() => { loadData(); }, [user?.id]);
  useFocusEffect(React.useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const visibleViewers = isPremium ? realViewers : realViewers.slice(0, freeViewLimit);
  const lockedCount = isPremium ? 0 : Math.max(0, realViewers.length - freeViewLimit);

  const renderCard = (item: any, isViewer = false, isLocked = false) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={async () => {
          if (isLocked) {
            Alert.alert("VIP Feature 👑", "Upgrade to VIP to see everyone who viewed your profile!", [
              { text: "Maybe Later", style: "cancel" },
              { text: "Become VIP 👑", onPress: () => router.push('/payment' as any) }
            ]);
            return;
          }
          if (!user?.id) return;
          const matchId = await getOrCreateMatch(user.id, item.id);
          router.push(`/chat/${matchId}`);
        }}
      >
        {isLocked ? (
          <View style={[styles.photo, styles.hiddenPhoto]}>
            <Text style={styles.lockIcon}>👑</Text>
            <Text style={styles.lockText}>VIP Only</Text>
          </View>
        ) : item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.hiddenPhoto]}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{isLocked ? "???" : (item.age ? `${item.name}, ${item.age}` : item.name)}</Text>
          {!isLocked && item.location ? <Text style={styles.location}>📍 {item.location}</Text> : null}
        </View>
        {!isLocked && (
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={async () => {
              if (isViewer) {
                if (!user?.id) return;
                const matchId = await getOrCreateMatch(user.id, item.id);
                router.push(`/chat/${matchId}`);
                return;
              }
              if (!user?.id) return;
              const result = await recordSwipe({ userId: user.id, targetId: item.id, action: 'like' });
              if (result.matched) {
                Alert.alert("It's a Match! 🎉", `You and ${item.name} liked each other!`, [
                  { text: 'Send Message', onPress: async () => { if (!user?.id) return; const matchId = await getOrCreateMatch(user.id, item.id); router.push(`/chat/${matchId}`); } },
                  { text: 'OK' },
                ]);
              } else {
                Alert.alert('Liked! ❤️', `You liked ${item.name}'s profile`);
              }
            }}
          >
            <Text style={styles.likeBtnText}>{isViewer ? "💬 Chat" : "❤️ Like Back"}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const dataToShow = tab === "likes"
    ? realLikes
    : [
        ...visibleViewers.map(v => ({ ...v, locked: false })),
        ...(lockedCount > 0 ? Array.from({ length: lockedCount }).map((_, i) => ({ id: `locked_${i}`, locked: true })) : []),
      ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Activity 💝</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "likes" && styles.tabActive]} onPress={() => setTab("likes")}>
          <Text style={[styles.tabText, tab === "likes" && styles.tabTextActive]}>❤️ Liked You ({realLikes.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "viewers" && styles.tabActive]} onPress={() => setTab("viewers")}>
          <Text style={[styles.tabText, tab === "viewers" && styles.tabTextActive]}>👀 Viewed Me ({realViewers.length})</Text>
        </TouchableOpacity>
      </View>

      {!isPremium && tab === "viewers" && lockedCount > 0 && (
        <TouchableOpacity style={styles.vipBanner} onPress={() => router.push('/payment' as any)}>
          <Text style={styles.vipBannerText}>👑 Upgrade to VIP to see {lockedCount} more viewer{lockedCount > 1 ? 's' : ''}!</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={dataToShow}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{tab === "likes" ? "❤️" : "👀"}</Text>
              <Text style={styles.emptyTitle}>{tab === "likes" ? "No likes yet" : "No profile views yet"}</Text>
              <Text style={styles.emptySub}>
                {tab === "likes" ? "Keep swiping — your fans will show up here!" : "When someone views your profile, they will appear here"}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => renderCard(item, tab === "viewers", (item as any).locked)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: Colors.primary, paddingHorizontal: 20, paddingTop: 12 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginVertical: 12, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 13, color: "#999", fontWeight: "600" },
  tabTextActive: { color: Colors.primary },
  vipBanner: { backgroundColor: "#FFF8E7", marginHorizontal: 16, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#FFD166" },
  vipBannerText: { color: "#B8860B", fontSize: 13, textAlign: "center", fontWeight: "600" },
  grid: { padding: 12, gap: 12, flexGrow: 1 },
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: "hidden", backgroundColor: "#f9f9f9", elevation: 3 },
  photo: { width: "100%", height: 180, resizeMode: "cover" },
  hiddenPhoto: { backgroundColor: "#f0e6ff", alignItems: "center", justifyContent: "center" },
  lockIcon: { fontSize: 32, marginBottom: 8 },
  lockText: { fontSize: 13, color: "#9B59B6", fontWeight: "bold" },
  info: { padding: 10 },
  name: { fontSize: 15, fontWeight: "bold", color: "#333" },
  location: { fontSize: 12, color: "#999", marginTop: 2 },
  likeBtn: { backgroundColor: Colors.primary, margin: 10, borderRadius: 20, paddingVertical: 8, alignItems: "center" },
  likeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyState: { alignItems: 'center' as const, justifyContent: 'center' as const, padding: 48, gap: 12, flex: 1, width: '100%' as const },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: '#333' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center' as const, paddingHorizontal: 24 },
});
