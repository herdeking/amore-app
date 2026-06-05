import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  Image, TouchableOpacity, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSwipe } from '../../hooks/useSwipe';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import { User } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function SwipeScreen() {
  const { profiles, swipe, matched, matchedUser, dismissMatch } = useSwipe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) handleSwipe('like');
      else if (gesture.dx < -SWIPE_THRESHOLD) handleSwipe('pass');
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });

  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    const target = profiles[currentIndex];
    if (!target) return;
    const x = action === 'like' || action === 'superlike' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      swipe(target.id, action);
      setCurrentIndex(i => i + 1);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const currentUser: User | undefined = profiles[currentIndex];

  if (!profiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>Amore 💕</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌟</Text>
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptyText}>Check back later for more matches!</Text>
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
          <Text style={styles.emptyTitle}>You\'ve seen everyone!</Text>
          <Text style={styles.emptyText}>Come back later for more</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Amore 💕</Text>

      <View style={styles.cardContainer}>
        {/* Next card underneath */}
        {profiles[currentIndex + 1] && (
          <View style={[styles.card, styles.nextCard]}>
            <Image
              source={{ uri: profiles[currentIndex + 1].photos?.[0] }}
              style={styles.cardImage}
            />
          </View>
        )}

        {/* Current card */}
        <Animated.View
          style={[styles.card, {
            transform: [...position.getTranslateTransform(), { rotate }]
          }]}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: currentUser?.photos?.[0] }} style={styles.cardImage} />

          {/* Like stamp */}
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>LIKE 💚</Text>
          </Animated.View>

          {/* Pass stamp */}
          <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
            <Text style={styles.stampText}>PASS ❌</Text>
          </Animated.View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{currentUser?.name}, {currentUser?.age}</Text>
            {currentUser?.bio && <Text style={styles.cardBio} numberOfLines={2}>{currentUser.bio}</Text>}
            {currentUser?.location && <Text style={styles.cardLocation}>📍 {currentUser.location}</Text>}
          </View>
        </Animated.View>
      </View>

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
          <Text style={styles.matchTitle}>It\'s a Match! 🎉</Text>
          <Text style={styles.matchSub}>You and {matchedUser.name} liked each other</Text>
          <Image source={{ uri: matchedUser.photos?.[0] }} style={styles.matchPhoto} />
          <TouchableOpacity style={styles.matchBtn} onPress={dismissMatch}>
            <Text style={styles.matchBtnText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  logo: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.primary, textAlign: 'center', paddingVertical: 12 },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: SCREEN_WIDTH - 32, height: SCREEN_HEIGHT * 0.6, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  nextCard: { transform: [{ scale: 0.95 }], top: 10 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  cardName: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  cardBio: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  cardLocation: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  stamp: { position: 'absolute', top: 40, padding: 8, borderWidth: 3, borderRadius: 8 },
  likeStamp: { right: 20, borderColor: Colors.like, transform: [{ rotate: '15deg' }] },
  passStamp: { left: 20, borderColor: Colors.pass, transform: [{ rotate: '-15deg' }] },
  stampText: { fontSize: 24, fontWeight: Theme.fontWeight.bold },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 20 },
  actionBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  passBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.pass },
  superBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.superlike },
  likeBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.like },
  actionIcon: { fontSize: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: Theme.fontSize.md, color: Colors.textLight, textAlign: 'center' },
  matchModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,75,110,0.95)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  matchTitle: { fontSize: Theme.fontSize.title, fontWeight: Theme.fontWeight.bold, color: Colors.white, marginBottom: 8 },
  matchSub: { fontSize: Theme.fontSize.md, color: 'rgba(255,255,255,0.9)', marginBottom: 24, textAlign: 'center' },
  matchPhoto: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: Colors.white, marginBottom: 24 },
  matchBtn: { backgroundColor: Colors.white, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  matchBtnText: { color: Colors.primary, fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.md },
});
