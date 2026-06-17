// app/(tabs)/video.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuthStore } from '../../store/authStore';
import { doc, updateDoc, setDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { uploadToCloudinary } from '../../services/cloudinary';

interface LiveStream {
  userId: string;
  userName: string;
  userPhoto: string;
  channelName: string;
  startedAt: string;
}

interface VideoProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  photo: string;
  videoUrl: string;
}

function VideoPlayerModal({ video, onClose }: { video: VideoProfile; onClose: () => void }) {
  const player = useVideoPlayer(video.videoUrl, p => {
    p.loop = true;
    p.play();
  });

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.playerClose} onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.playerTitle}>{video.name}'s Intro</Text>
        <VideoView style={styles.playerVideo} player={player} contentFit="contain" nativeControls />
        <Text style={styles.playerLocation}>📍 {video.location}</Text>
      </View>
    </Modal>
  );
}

export default function VideoScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<"live" | "profiles">("live");
  const [uploading, setUploading] = useState(false);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [videoProfiles, setVideoProfiles] = useState<VideoProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoProfile | null>(null);
  const [goingLive, setGoingLive] = useState(false);

  const myStream = liveStreams.find(s => s.userId === user?.id);

  const loadVideoProfiles = useCallback(async () => {
    try {
      const snap = await onSnapshotOnce();
    } catch {}
  }, []);

  const onSnapshotOnce = async () => {
    const { getDocs } = await import('firebase/firestore');
    const snap = await getDocs(query(collection(db, 'users'), where('videoProfile', '!=', null)));
    const profiles = snap.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      age: d.data().age,
      location: d.data().location,
      photo: d.data().photos?.[0],
      videoUrl: d.data().videoProfile,
    })).filter(p => p.videoUrl) as VideoProfile[];
    setVideoProfiles(profiles);
  };

  useEffect(() => {
    onSnapshotOnce();
  }, []);

  // Real-time live streams
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'liveStreams'), (snap) => {
      setLiveStreams(snap.docs.map(d => d.data() as LiveStream));
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onSnapshotOnce();
    setRefreshing(false);
  };

  const handleGoLive = async () => {
    if (!user?.id) return;
    if (myStream) {
      // Already live - rejoin
      router.push({
        pathname: `/call/${user.id}`,
        params: {
          type: 'video',
          callerId: user.id,
          callerName: user.name,
          channelName: myStream.channelName,
          isLive: 'true',
        }
      } as any);
      return;
    }

    Alert.alert('Go Live 🔴', 'Start a live video broadcast? Other users will be able to join and watch you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Go Live',
        onPress: async () => {
          setGoingLive(true);
          try {
            const channelName = `live_${user.id}_${Date.now()}`;
            await setDoc(doc(db, 'liveStreams', user.id), {
              userId: user.id,
              userName: user.name,
              userPhoto: user.photos?.[0] ?? '',
              channelName,
              startedAt: new Date().toISOString(),
            });
            router.push({
              pathname: `/call/${user.id}`,
              params: {
                type: 'video',
                callerId: user.id,
                callerName: user.name,
                channelName,
                isLive: 'true',
              }
            } as any);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setGoingLive(false);
          }
        }
      }
    ]);
  };

  const handleJoinLive = (stream: LiveStream) => {
    if (stream.userId === user?.id) {
      handleGoLive();
      return;
    }
    router.push({
      pathname: `/call/${stream.userId}`,
      params: {
        type: 'video',
        callerId: stream.userId,
        callerName: stream.userName,
        receiverId: user?.id,
        receiverName: user?.name,
        channelName: stream.channelName,
        isLive: 'true',
      }
    } as any);
  };

  const handleUploadVideoProfile = async () => {
    if (!user?.isPremium) {
      Alert.alert("VIP Feature 👑", "Upload a video profile to get 5x more matches! Upgrade to VIP.", [
        { text: "Maybe Later", style: "cancel" },
        { text: "Become VIP 👑", onPress: () => router.push('/payment' as any) }
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 15,
    });
    if (!result.canceled && result.assets?.[0]) {
      setUploading(true);
      try {
        const videoUrl = await uploadToCloudinary(result.assets[0].uri);
        await updateDoc(doc(db, 'users', user?.id ?? ''), { videoProfile: videoUrl });
        setUser({ ...user, videoProfile: videoUrl } as any);
        Alert.alert("Video Uploaded! 🎉", "Your 15-second video profile is now live. You will get more matches!");
        await onSnapshotOnce();
        setTab("profiles");
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.liveBtn} onPress={handleGoLive} disabled={goingLive}>
            <Text style={styles.liveBtnText}>{myStream ? '🔴 Live' : goingLive ? '...' : '🔴 Go Live'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadVideoProfile}>
            <Text style={styles.uploadBtnText}>{uploading ? "Uploading..." : "+ My Video"}</Text>
          </TouchableOpacity>
        </View>
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
          data={liveStreams}
          numColumns={2}
          keyExtractor={i => i.userId}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔴</Text>
              <Text style={styles.emptyTitle}>No one is live right now</Text>
              <Text style={styles.emptySub}>Be the first to go live!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleJoinLive(item)}>
              <Image source={{ uri: item.userPhoto }} style={styles.photo} />
              <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.userName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={videoProfiles}
          numColumns={2}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={styles.emptyTitle}>No video profiles yet</Text>
              <Text style={styles.emptySub}>Upload yours to be the first!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedVideo(item)}>
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

      {selectedVideo && (
        <VideoPlayerModal
          key={selectedVideo.id}
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FF4B6E" },
  liveBtn: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#FF3B30", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  liveBtnText: { color: "#FF3B30", fontWeight: "700", fontSize: 12 },
  uploadBtn: { backgroundColor: "#FF4B6E", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  uploadBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 13, color: "#999", fontWeight: "600" },
  tabTextActive: { color: "#FF4B6E" },
  grid: { padding: 8, flexGrow: 1 },
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: "hidden", backgroundColor: "#f9f9f9", elevation: 3, aspectRatio: 0.8 },
  photo: { width: "100%", height: "100%", position: "absolute" },
  liveBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#FF3B30", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  playBtn: { position: "absolute", top: "40%", left: "40%", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 24, width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  info: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: "rgba(0,0,0,0.5)" },
  name: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bio: { color: "#eee", fontSize: 11, marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  emptySub: { fontSize: 13, color: "#999" },
  playerContainer: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  playerClose: { position: "absolute", top: 50, right: 16, zIndex: 10 },
  playerTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  playerVideo: { width: "100%", height: 400 },
  playerLocation: { color: "#ccc", fontSize: 13, marginTop: 12 },
});
