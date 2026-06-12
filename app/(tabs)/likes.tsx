import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getProfileViewers } from '../../services/profileViews';
import { fetchWhoLikedMe } from '../../services/likesService';
import { recordSwipe } from '../../services/swipeService';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

const DEMO_LIKES = [
  { id: '1', name: 'Amara', age: 24, photo: 'https://randomuser.me/api/portraits/women/1.jpg', location: 'Lagos' },
  { id: '2', name: 'Chioma', age: 26, photo: 'https://randomuser.me/api/portraits/women/2.jpg', location: 'Abuja' },
  { id: '3', name: 'Fatima', age: 23, photo: 'https://randomuser.me/api/portraits/women/3.jpg', location: 'Kano' },
  { id: '4', name: 'Ngozi', age: 27, photo: 'https://randomuser.me/api/portraits/women/4.jpg', location: 'PH' },
  { id: '5', name: 'Blessing', age: 25, photo: 'https://randomuser.me/api/portraits/women/5.jpg', location: 'Ibadan' },
  { id: '6', name: 'Adaeze', age: 22, photo: 'https://randomuser.me/api/portraits/women/6.jpg', location: 'Lagos' },
];

const DEMO_VIEWERS = [
  { id: 'v1', name: 'Kemi', age: 28, photo: 'https://randomuser.me/api/portraits/women/7.jpg', location: 'Enugu' },
  { id: 'v2', name: 'Tolu', age: 24, photo: 'https://randomuser.me/api/portraits/women/8.jpg', location: 'Lagos' },
  { id: 'v3', name: 'Halima', age: 26, photo: 'https://randomuser.me/api/portraits/women/9.jpg', location: 'Abuja' },
  { id: 'v4', name: 'Hidden', age: 0, photo: '', location: '' },
  { id: 'v5', name: 'Hidden', age: 0, photo: '', location: '' },
  { id: 'v6', name: 'Hidden', age: 0, photo: '', location: '' },
];

export default function LikesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"likes" | "viewers">("likes");
  const isPremium = user?.isPremium ?? false;
  const freeViewLimit = 3;
  const [realLikes, setRealLikes] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    fetchWhoLikedMe(user.id).then(users => {
      setRealLikes(users.map(u => ({
        id: u.id,
        name: u.name || 'Unknown',
        age: u.age ?? 0,
        photo: u.photos?.[0] ?? 'https://randomuser.me/api/portraits/lego/1.jpg',
        location: u.location ?? '',
      })));
    });
  }, [user?.id]);

  const likesData = [...realLikes, ...DEMO_LIKES];

  const renderCard = (item: any, isViewer = false) => {
    const isHidden = isViewer && !isPremium && parseInt(item.id.replace("v","")) > freeViewLimit;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (isHidden) {
            Alert.alert("VIP Feature 👑", "Upgrade to VIP to see everyone who viewed your profile!", [
              { text: "Maybe Later", style: "cancel" },
              { text: "Become VIP 👑" }
            ]);
            return;
          }
          router.push(`/chat/${item.id}`);
        }}
      >
        {isHidden ? (
          <View style={[styles.photo, styles.hiddenPhoto]}>
            <Text style={styles.lockIcon}>👑</Text>
            <Text style={styles.lockText}>VIP Only</Text>
          </View>
        ) : (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{isHidden ? "???": `${item.name}, ${item.age}`}</Text>
          {!isHidden && <Text style={styles.location}>📍 {item.location}</Text>}
        </View>
        {!isHidden && (
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={async () => {
              if (isViewer) {
                router.push(`/chat/${item.id}`);
                return;
              }
              if (!user?.id) return;
              const result = await recordSwipe({ userId: user.id, targetId: item.id, action: 'like' });
              if (result.matched) {
                Alert.alert("It's a Match! 🎉", `You and ${item.name} liked each other!`, [
                  { text: 'Send Message', onPress: () => router.push(`/chat/${item.id}`) },
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Activity 💝</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "likes" && styles.tabActive]} onPress={() => setTab("likes")}>
          <Text style={[styles.tabText, tab === "likes" && styles.tabTextActive]}>❤️ Liked You ({likesData.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "viewers" && styles.tabActive]} onPress={() => setTab("viewers")}>
          <Text style={[styles.tabText, tab === "viewers" && styles.tabTextActive]}>👀 Viewed Me ({isPremium ? DEMO_VIEWERS.length : freeViewLimit + "+"})</Text>
        </TouchableOpacity>
      </View>

      {!isPremium && tab === "viewers" && (
        <TouchableOpacity style={styles.vipBanner}>
          <Text style={styles.vipBannerText}>👑 Upgrade to VIP to see all {DEMO_VIEWERS.length} viewers!</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={tab === "likes" ? likesData : DEMO_VIEWERS}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => renderCard(item, tab === "viewers")}
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
  grid: { padding: 12, gap: 12 },
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
});
