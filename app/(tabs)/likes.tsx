import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const DEMO_LIKES = [
  { id: '1', name: 'Amara', age: 24, photo: 'https://randomuser.me/api/portraits/women/1.jpg', location: 'Lagos' },
  { id: '2', name: 'Chioma', age: 26, photo: 'https://randomuser.me/api/portraits/women/2.jpg', location: 'Abuja' },
  { id: '3', name: 'Fatima', age: 23, photo: 'https://randomuser.me/api/portraits/women/3.jpg', location: 'Kano' },
  { id: '4', name: 'Ngozi', age: 27, photo: 'https://randomuser.me/api/portraits/women/4.jpg', location: 'PH' },
  { id: '5', name: 'Blessing', age: 25, photo: 'https://randomuser.me/api/portraits/women/5.jpg', location: 'Ibadan' },
  { id: '6', name: 'Adaeze', age: 22, photo: 'https://randomuser.me/api/portraits/women/6.jpg', location: 'Lagos' },
];

export default function LikesScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Who Liked You 💝</Text>
      <Text style={styles.subtitle}>{DEMO_LIKES.length} people liked your profile</Text>
      <FlatList
        data={DEMO_LIKES}
        numColumns={2}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.id}`)}>
            <Image source={{ uri: item.photo }} style={styles.photo} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}, {item.age}</Text>
              <Text style={styles.location}>📍 {item.location}</Text>
            </View>
            <TouchableOpacity style={styles.likeBtn}>
              <Text style={styles.likeBtnText}>❤️ Like Back</Text>
            </TouchableOpacity>
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
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f9f9f9', elevation: 3 },
  photo: { width: '100%', height: 180, resizeMode: 'cover' },
  info: { padding: 10 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  location: { fontSize: 12, color: '#999', marginTop: 2 },
  likeBtn: { backgroundColor: '#FF4B6E', margin: 10, borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  likeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
