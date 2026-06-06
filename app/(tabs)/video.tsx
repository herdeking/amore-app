import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEMO_LIVE = [
  { id: '1', name: 'Amara', photo: 'https://randomuser.me/api/portraits/women/1.jpg', viewers: 234, isLive: true },
  { id: '2', name: 'Chioma', photo: 'https://randomuser.me/api/portraits/women/2.jpg', viewers: 89, isLive: true },
  { id: '3', name: 'Fatima', photo: 'https://randomuser.me/api/portraits/women/3.jpg', viewers: 512, isLive: true },
  { id: '4', name: 'Ngozi', photo: 'https://randomuser.me/api/portraits/women/4.jpg', viewers: 45, isLive: false },
  { id: '5', name: 'Blessing', photo: 'https://randomuser.me/api/portraits/women/5.jpg', viewers: 178, isLive: true },
  { id: '6', name: 'Adaeze', photo: 'https://randomuser.me/api/portraits/women/6.jpg', viewers: 320, isLive: false },
];

export default function VideoScreen() {
  const handleJoin = () => {
    Alert.alert('Video Chat', 'Free users get 10 seconds. Upgrade to VIP for unlimited!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Join (10s free)' },
      { text: 'Become VIP' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Video 📹</Text>
      <Text style={styles.subtitle}>Live users near you</Text>
      <FlatList
        data={DEMO_LIVE}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={handleJoin}>
            <Image source={{ uri: item.photo }} style={styles.photo} />
            {item.isLive && <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE</Text></View>}
            <View style={styles.viewerBadge}><Text style={styles.viewerText}>👁 {item.viewers}</Text></View>
            <View style={styles.info}><Text style={styles.name}>{item.name}</Text></View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF4B6E', paddingHorizontal: 20, paddingTop: 12 },
  subtitle: { fontSize: 14, color: '#999', paddingHorizontal: 20, marginBottom: 12 },
  grid: { padding: 12, gap: 12 },
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', elevation: 3, height: 220 },
  photo: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.85 },
  liveBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#FF4B4B', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  viewerBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  viewerText: { color: '#fff', fontSize: 11 },
  info: { position: 'absolute', bottom: 10, left: 10 },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
