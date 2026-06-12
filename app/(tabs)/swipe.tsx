import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  Image, TouchableOpacity, Dimensions, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSwipe } from '../../hooks/useSwipe';
import { useLocation } from '../../hooks/useLocation';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import { User } from '../../types';

const { width: SW, height: SH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SW * 0.3;

export default function SwipeScreen() {
  const { profiles, swipe, matched, matchedUser, dismissMatch } = useSwipe();
  useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SW, 0, SW],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SW * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = position.x.interpolate({
    inputRange: [-SW * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) handleSwipe('like');
      else if (g.dx < -SWIPE_THRESHOLD) handleSwipe('pass');
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });

  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    const target = profiles[currentIndex];
    if (!target) return;
    const x = action === 'pass' ? -SW * 1.5 : SW * 1.5;
    Animated.timing(position, { toValue: { x, y: 0 }, duration: 300, useNativeDriver: false }).start(() => {
      swipe(target.id, action);
      setCurrentIndex(i => i + 1);
      setPhotoIndex(0);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const current: User | undefined = profiles[currentIndex];
  const next: User | undefined = profiles[currentIndex + 1];

  if (!profiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>Amore 💕</Text>
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>Amore 💕</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💫</Text>
          <Text style={styles.emptyTitle}>You have seen everyone!</Text>
          <Text style={styles.emptyText}>Come back later for more</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setCurrentIndex(0)}>
            <Text style={styles.resetText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Amore 💕</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {/* Next card */}
        {next && (
          <View style={[styles.card, styles.nextCard]}>
            <Image source={{ uri: next.photos?.[0] }} style={styles.cardImage} />
          </View>
        )}

        {/* Current card */}
        <Animated.View
          style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate }] }]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: current?.photos?.[photoIndex] ?? current?.photos?.[0] }}
            style={styles.cardImage}
          />

          {/* Photo dots */}
          {(current?.photos?.length ?? 0) > 1 && (
            <View style={styles.photoDots}>
              {current?.photos?.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setPhotoIndex(i)}>
                  <View style={[styles.dot, i === photoIndex && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Like stamp */}
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>LIKE 💚</Text>
          </Animated.View>

          {/* Pass stamp */}
          <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
            <Text style={styles.stampText}>NOPE ❌</Text>
          </Animated.View>

          {/* Info */}
          <TouchableOpacity style={styles.cardInfo} onPress={() => setShowProfile(true)} activeOpacity={0.9}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardName}>{current?.name}, {current?.age}</Text>
              <View style={styles.onlineDot} />
              <View style={{ flex: 1 }} />
              <Ionicons name="information-circle-outline" size={26} color="#fff" />
            </View>
            {current?.location && (
              <Text style={styles.cardLocation}>📍 {current.location}</Text>
            )}
            {current?.bio && (
              <Text style={styles.cardBio} numberOfLines={2}>{current.bio}</Text>
            )}
            {(current?.interests?.length ?? 0) > 0 && (
              <View style={styles.tags}>
                {(current?.interests ?? []).slice(0, 3).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Profile Detail Modal */}
      <Modal visible={showProfile} animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <ScrollView>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: current?.photos?.[0] }} style={{ width: '100%', height: 400 }} />
              <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.profileName}>{current?.name}, {current?.age}</Text>
              {current?.location && <Text style={styles.profileLocation}>📍 {current.location}</Text>}
              {current?.bio && <Text style={styles.profileBio}>{current.bio}</Text>}
              {(current?.interests?.length ?? 0) > 0 && (
                <View style={[styles.tags, { marginTop: 12 }]}>
                  {(current?.interests ?? []).map(tag => (
                    <View key={tag} style={[styles.tag, { backgroundColor: '#FFE5EA' }]}>
                      <Text style={[styles.tagText, { color: Colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(current?.photos?.length ?? 0) > 1 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.morePhotosTitle}>More Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {current?.photos?.slice(1).map((p, i) => (
                      <Image key={i} source={{ uri: p }} style={styles.morePhoto} />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => handleSwipe('pass')}>
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.superBtn]} onPress={() => handleSwipe('superlike')}>
          <Text style={styles.actionIcon}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleSwipe('like')}>
          <Text style={styles.actionIcon}>♥</Text>
        </TouchableOpacity>
      </View>

      {/* Match modal */}
      {matched && matchedUser && (
        <View style={styles.matchModal}>
          <Text style={styles.matchTitle}>Its a Match! 🎉</Text>
          <Text style={styles.matchSub}>You and {matchedUser.name} liked each other</Text>
          <Image source={{ uri: matchedUser.photos?.[0] }} style={styles.matchPhoto} />
          <TouchableOpacity style={styles.chatBtn} onPress={dismissMatch}>
            <Text style={styles.chatBtnText}>💬 Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keepBtn} onPress={dismissMatch}>
            <Text style={styles.keepBtnText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  logo: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.primary },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  filterIcon: { fontSize: 18 },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: SW - 32, height: SH * 0.62, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surface, elevation: 5 },
  nextCard: { transform: [{ scale: 0.95 }], top: 10 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoDots: { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: Colors.white, width: 20 },
  stamp: { position: 'absolute', top: 40, padding: 8, borderWidth: 3, borderRadius: 8 },
  likeStamp: { right: 20, borderColor: Colors.like, transform: [{ rotate: '15deg' }] },
  passStamp: { left: 20, borderColor: Colors.pass, transform: [{ rotate: '-15deg' }] },
  stampText: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardName: { fontSize: 22, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  cardLocation: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  cardBio: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: Colors.white, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 16 },
  actionBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 3, backgroundColor: Colors.white },
  passBtn: { borderWidth: 2, borderColor: '#FF6B6B' },
  superBtn: { borderWidth: 2, borderColor: '#FFD700' },
  likeBtn: { borderWidth: 2, borderColor: '#4CAF50' },
  actionIcon: { fontSize: 26 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  emptyText: { fontSize: 15, color: Colors.textLight },
  resetBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  resetText: { color: Colors.white, fontWeight: Theme.fontWeight.bold, fontSize: 16 },
  closeProfileBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 },
  profileName: { fontSize: 26, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 4 },
  profileLocation: { fontSize: 15, color: Colors.textLight, marginBottom: 12 },
  profileBio: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  morePhotosTitle: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 10 },
  morePhoto: { width: 120, height: 160, borderRadius: 12, marginRight: 10 },
  matchModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,75,110,0.96)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  matchTitle: { fontSize: 32, fontWeight: Theme.fontWeight.bold, color: Colors.white, marginBottom: 8 },
  matchSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 24, textAlign: 'center' },
  matchPhoto: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: Colors.white, marginBottom: 24 },
  chatBtn: { backgroundColor: Colors.white, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, marginBottom: 12 },
  chatBtnText: { color: Colors.primary, fontWeight: Theme.fontWeight.bold, fontSize: 16 },
  keepBtn: { paddingVertical: 10 },
  keepBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
});
