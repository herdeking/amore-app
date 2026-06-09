import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { uploadToCloudinary } from '../../services/cloudinary';

const DEMO_LIVE = [
  { id: "1", name: "Amara", photo: "https://randomuser.me/api/portraits/women/1.jpg", viewers: 234, isLive: true, bio: "Artist & dreamer ✨" },
  { id: "2", name: "Chioma", photo: "https://randomuser.me/api/portraits/women/2.jpg", viewers: 89, isLive: true, bio: "Coffee addict ☕" },
  { id: "3", name: "Fatima", photo: "https://randomuser.me/api/portraits/women/3.jpg", viewers: 512, isLive: true, bio: "Yoga & wellness 🧘" },
  { id: "4", name: "Ngozi", photo: "https://randomuser.me/api/portraits/women/4.jpg", viewers: 45, isLive: false, bio: "Foodie & traveler 🌍" },
  { id: "5", name: "Blessing", photo: "https://randomuser.me/api/portraits/women/5.jpg", viewers: 178, isLive: true, bio: "Music lover 🎵" },
  { id: "6", name: "Adaeze", photo: "https://randomuser.me/api/portraits/women/6.jpg", viewers: 320, isLive: false, bio: "Tech girl 💻" },
];

const DEMO_PROFILES = [
  { id: "p1", name: "Kemi", photo: "https://randomuser.me/api/portraits/women/7.jpg", age: 25, location: "Lagos" },
  { id: "p2", name: "Tolu", photo: "https://randomuser.me/api/portraits/women/8.jpg", age: 23, location: "Abuja" },
  { id: "p3", name: "Halima", photo: "https://randomuser.me/api/portraits/women/9.jpg", age: 27, location: "Kano" },
];

export default function VideoScreen() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<"live" | "profiles">("live");
  const [uploading, setUploading] = useState(false);
  const [liveJoined, setLiveJoined] = useState(0);

  const handleJoin = (name: string) => {
    if (!user?.isPremium && liveJoined >= 3) {
      Alert.alert("VIP Feature 👑", "Free users can join 3 live streams per day. Upgrade to VIP for unlimited!", [
        { text: "Maybe Later", style: "cancel" },
        { text: "👑 Become VIP" }
      ]);
      return;
    }
    Alert.alert("Join " + name + "'s Live", "Free users get 10 seconds. Upgrade to VIP for unlimited!", [
      { text: "Cancel", style: "cancel" },
      { text: "Join (10s free)", onPress: () => { setLiveJoined(prev => prev + 1); Alert.alert("Joined!", "You joined " + name + "'s live stream. 10 second free preview!"); } },
      { text: "👑 Become VIP" },
    ]);
  };

  const handleUploadVideoProfile = async () => {
    if (!user?.isPremium) {
      Alert.alert("VIP Feature 👑", "Upload a video profile to get 5x more matches! Upgrade to VIP.", [
        { text: "Maybe Later", style: "cancel" },
        { text: "Become VIP 👑" }
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 15,
    });
    if (!result.canceled) {
      setUploading(true);
      try {
        Alert.alert("Video Uploaded! 🎉", "Your 15-second video profile is now live. You will get more matches!");
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video 📹</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadVideoProfile}>
          <Text style={styles.uploadBtnText}>{uploading ? "Uploading..." : "+ My Video"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "live" && styles.tabActive]} onPress={() => setTab("live")}>
          <Text style={[styles.tabText, tab === "live" && styles.tabTextActive]}>🔴 Live Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "profiles" && styles.tabActive]} onPress={() => setTab("profiles")}>
          <Text style={[styles.tabText, tab === "profiles" && styles.tabTextActive]}>🎬 Video Profiles</Text>
        </TouchableOpacity>
      </View>

      {tab === "live" ? (
        <FlatList
          data={DEMO_LIVE}
          numColumns={2}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleJoin(item.name)}>
              <Image source={{ uri: item.photo }} style={styles.photo} />
              {item.isLive && <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE</Text></View>}
              <View style={styles.viewerBadge}><Text style={styles.viewerText}>👁 {item.viewers}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.bio}>{item.bio}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={DEMO_PROFILES}
          numColumns={2}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => {
              const idx = DEMO_PROFILES.findIndex(p => p.id === item.id);
              if (!user?.isPremium && idx >= 2) {
                Alert.alert("VIP Feature 👑", "Free users can watch 2 video profiles. Upgrade to VIP to watch all!", [
                  { text: "Maybe Later", style: "cancel" },
                  { text: "👑 Become VIP" }
                ]);
                return;
              }
              Alert.alert("▶ " + item.name + "'s Video", "Playing " + item.name + "'s 15-second intro...", [
                { text: "Close", style: "cancel" }
              ]);
            }}>
              <Image source={{ uri: item.photo }} style={styles.photo} />
              <View style={styles.playBtn}><Text style={{ fontSize: 24 }}>▶</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}, {item.age}</Text>
                <Text style={styles.bio}>📍 {item.location}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FF4B6E" },
  uploadBtn: { backgroundColor: "#FF4B6E", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  uploadBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 13, color: "#999", fontWeight: "600" },
  tabTextActive: { color: "#FF4B6E" },
  grid: { padding: 12, gap: 12 },
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: "hidden", backgroundColor: "#000", elevation: 3, height: 220 },
  photo: { width: "100%", height: "100%", resizeMode: "cover", opacity: 0.85 },
  liveBadge: { position: "absolute", top: 10, left: 10, backgroundColor: "#FF4B4B", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  liveText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  viewerBadge: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  viewerText: { color: "#fff", fontSize: 11 },
  playBtn: { position: "absolute", top: "35%", alignSelf: "center", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 30, width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  info: { position: "absolute", bottom: 10, left: 10 },
  name: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  bio: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
});
