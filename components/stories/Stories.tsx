// components/stories/Stories.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Modal, StyleSheet, Dimensions, Animated, Alert
} from 'react-native';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

interface Story {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  photoUrl: string;
  createdAt: string;
  expiresAt: string;
}

interface UserStories {
  userId: string;
  userName: string;
  userPhoto: string;
  stories: Story[];
  seen: boolean;
}

export default function Stories({ currentUser }: { currentUser: any }) {
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [viewing, setViewing] = useState<UserStories | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, 'stories'),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc')
      );
      const snap = await getDocs(q);
      const grouped: Record<string, UserStories> = {};
      snap.docs.forEach(d => {
        const s = { id: d.id, ...d.data() } as Story;
        if (!grouped[s.userId]) {
          grouped[s.userId] = {
            userId: s.userId,
            userName: s.userName,
            userPhoto: s.userPhoto,
            stories: [],
            seen: false,
          };
        }
        grouped[s.userId].stories.push(s);
      });
      setUserStories(Object.values(grouped));
    } catch (e) {
      console.error('fetchStories error:', e);
    }
  };

  const addStory = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri);
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.photos?.[0] ?? '',
        photoUrl: url,
        createdAt: new Date().toISOString(),
        expiresAt: expires,
      });
      fetchStories();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  const openStory = (us: UserStories) => {
    setViewing(us);
    setStoryIndex(0);
    startProgress();
  };

  const startProgress = () => {
    progress.setValue(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start();
    timerRef.current = setTimeout(() => nextStory(), STORY_DURATION);
  };

  const nextStory = () => {
    if (!viewing) return;
    if (storyIndex < viewing.stories.length - 1) {
      setStoryIndex(i => i + 1);
      startProgress();
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1);
      startProgress();
    }
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {/* Add story button */}
        <TouchableOpacity style={styles.addStory} onPress={addStory} disabled={uploading}>
          <View style={styles.addStoryInner}>
            <Image source={{ uri: currentUser?.photos?.[0] }} style={styles.storyAvatar} />
            <View style={styles.plusBadge}>
              <Text style={styles.plusText}>{uploading ? '...' : '+'}</Text>
            </View>
          </View>
          <Text style={styles.storyName}>My Story</Text>
        </TouchableOpacity>

        {/* Other users stories */}
        {userStories.filter(us => us.userId !== currentUser?.id).map(us => (
          <TouchableOpacity key={us.userId} style={styles.storyItem} onPress={() => openStory(us)}>
            <View style={[styles.storyRing, us.seen && styles.storyRingSeen]}>
              <Image source={{ uri: us.userPhoto }} style={styles.storyAvatar} />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>{us.userName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Story viewer modal */}
      <Modal visible={!!viewing} animationType="fade" statusBarTranslucent>
        {viewing && (
          <View style={styles.viewer}>
            <Image
              source={{ uri: viewing.stories[storyIndex]?.photoUrl }}
              style={styles.storyImage}
              resizeMode="cover"
            />
            {/* Progress bars */}
            <View style={styles.progressRow}>
              {viewing.stories.map((_, i) => (
                <View key={i} style={styles.progressTrack}>
                  <Animated.View style={[
                    styles.progressFill,
                    {
                      width: i < storyIndex ? '100%' :
                             i === storyIndex ? progress.interpolate({
                               inputRange: [0, 1], outputRange: ['0%', '100%']
                             }) : '0%'
                    }
                  ]} />
                </View>
              ))}
            </View>
            {/* Header */}
            <View style={styles.viewerHeader}>
              <Image source={{ uri: viewing.userPhoto }} style={styles.viewerAvatar} />
              <Text style={styles.viewerName}>{viewing.userName}</Text>
              <TouchableOpacity onPress={() => setViewing(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Tap zones */}
            <View style={styles.tapZones}>
              <TouchableOpacity style={styles.tapLeft} onPress={prevStory} />
              <TouchableOpacity style={styles.tapRight} onPress={nextStory} />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 8 },
  addStory: { alignItems: 'center', marginRight: 12, width: 70 },
  addStoryInner: { position: 'relative' },
  storyItem: { alignItems: 'center', marginRight: 12, width: 70 },
  storyRing: { borderWidth: 2.5, borderColor: '#FF4B6E', borderRadius: 38, padding: 2 },
  storyRingSeen: { borderColor: '#ccc' },
  storyAvatar: { width: 60, height: 60, borderRadius: 30 },
  plusBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF4B6E', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 20 },
  storyName: { fontSize: 11, color: '#333', marginTop: 4, textAlign: 'center' },
  viewer: { flex: 1, backgroundColor: '#000' },
  storyImage: { width, height },
  progressRow: { position: 'absolute', top: 50, left: 8, right: 8, flexDirection: 'row', gap: 4 },
  progressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: '#fff', borderRadius: 2 },
  viewerHeader: { position: 'absolute', top: 60, left: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#fff' },
  viewerName: { color: '#fff', fontWeight: '600', fontSize: 14, flex: 1 },
  closeBtn: { padding: 4 },
  tapZones: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
});
