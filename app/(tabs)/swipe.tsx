import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  Image, TouchableOpacity, Dimensions, ActivityIndicator, Modal, ScrollView, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSwipe } from '../../hooks/useSwipe';
import * as Haptics from 'expo-haptics';
import { getOrCreateMatch } from '../../services/swipeService';
import { createNotification } from '../../services/notificationActivity';
import { collection, addDoc, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';
import { User } from '../../types';

const { width: SW, height: SH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SW * 0.3;

const calcAge = (dobStr: string): number => {
  if (!dobStr) return 0;
  let day, month, year;
  if (dobStr.includes('-')) {
    [year, month, day] = dobStr.split('-').map(Number);
  } else {
    [day, month, year] = dobStr.split('/').map(Number);
  }
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

import { calculateMatchScore, getScoreColor, getScoreLabel } from '../../services/matchScore';
import { Analytics } from '../../services/analyticsService';
import { SwipeCardSkeleton } from '../../components/ui/Skeleton';

// ── Confetti piece component ──
const ConfettiPiece = ({ index }: { index: number }) => {
  const anim = React.useRef(new Animated.Value(0)).current;
  const colors = ['#FF4B6E', '#FFD166', '#06D6A0', '#118AB2', '#FFB347', '#FF69B4'];
  const color = colors[index % colors.length];
  const left = (index * 37) % 100;
  const size = 8 + (index % 6);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1500 + (index % 5) * 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0,
      left: `${left}%` as any,
      width: size,
      height: size,
      borderRadius: index % 2 === 0 ? size / 2 : 0,
      backgroundColor: color,
      transform: [{
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 700] }),
      }, {
        rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + index * 30}deg`] }),
      }],
      opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
    }} />
  );
};

const calcDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

const DAILY_SWIPE_LIMIT = 20;

const getDailySwipeCount = async (userId: string): Promise<number> => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const key = `swipes_${userId}_${new Date().toDateString()}`;
  const val = await AsyncStorage.getItem(key);
  return val ? parseInt(val) : 0;
};

const incrementSwipeCount = async (userId: string) => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const key = `swipes_${userId}_${new Date().toDateString()}`;
  const current = await getDailySwipeCount(userId);
  await AsyncStorage.setItem(key, String(current + 1));
};

export default function SwipeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { profiles, swipe, matched, matchedUser, dismissMatch, refresh } = useSwipe();
  const [refreshing, setRefreshing] = useState(false);
  const [swipesLeft, setSwipesLeft] = useState<number>(DAILY_SWIPE_LIMIT);
  const [lastSwipedUser, setLastSwipedUser] = useState<any>(null);
  const [filterInterest, setFilterInterest] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const INTEREST_OPTIONS = ['Music', 'Travel', 'Food', 'Art', 'Tech', 'Gaming', 'Fitness',
    'Reading', 'Cooking', 'Dancing', 'Yoga', 'Photography', 'Fashion', 'Movies', 'Sports'];

  const filteredProfiles = filterInterest
    ? profiles.filter(p => (p.interests ?? []).includes(filterInterest))
    : profiles;
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [superAnim] = useState(new Animated.Value(0));
  const [showSuperAnim, setShowSuperAnim] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getDailySwipeCount(user.id).then(count => {
      setSwipesLeft(Math.max(0, DAILY_SWIPE_LIMIT - count));
    });
  }, [user?.id]);
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

  const reportUser = async (targetId: string | undefined, reason: 'reported' | 'blocked') => {
    if (!targetId || !user?.id) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.id,
        reportedId: targetId,
        reason,
        createdAt: new Date().toISOString(),
      });
    } catch {}
  };

  const triggerSuperAnim = () => {
    setShowSuperAnim(true);
    superAnim.setValue(0);
    Animated.sequence([
      Animated.spring(superAnim, { toValue: 1, useNativeDriver: true, tension: 50 }),
      Animated.delay(800),
      Animated.timing(superAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowSuperAnim(false));
  };

  const undoLastSwipe = () => {
    if (!lastSwipedUser) {
      Alert.alert('Nothing to undo', 'No recent swipe to undo');
      return;
    }
    profiles.unshift(lastSwipedUser);
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setLastSwipedUser(null);
    setLastAction(null);
  };

  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    const target = profiles[currentIndex];
    if (!target) return;

    // Haptic feedback
    if (action === 'like') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Analytics.swipeLike(target.id);
    } else if (action === 'superlike') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Analytics.swipeSuperLike(target.id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Analytics.swipePass(target.id);
    }

    const x = action === 'pass' ? -SW * 1.5 : SW * 1.5;
    Animated.timing(position, { toValue: { x, y: 0 }, duration: 300, useNativeDriver: false }).start(() => {
      swipe(target.id, action);
      setCurrentIndex(i => i + 1);
      setPhotoIndex(0);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const current: User | undefined = filteredProfiles[currentIndex];
  const next: User | undefined = filteredProfiles[currentIndex + 1];

  if (!profiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>Amore 💕</Text>
        {!user?.isPremium && (
          <Text style={styles.swipeCounter}>{swipesLeft}/{DAILY_SWIPE_LIMIT} swipes</Text>
        )}
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentIndex >= filteredProfiles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>Amore 💕</Text>
        {!user?.isPremium && (
          <Text style={styles.swipeCounter}>{swipesLeft}/{DAILY_SWIPE_LIMIT} swipes</Text>
        )}
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
        {!user?.isPremium && (
          <Text style={styles.swipeCounter}>{swipesLeft}/{DAILY_SWIPE_LIMIT} swipes</Text>
        )}
        <TouchableOpacity
          style={[styles.filterBtn, filterInterest && { backgroundColor: Colors.primary }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={18} color={filterInterest ? '#fff' : Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={async () => {
            setRefreshing(true);
            await refresh();
            setCurrentIndex(0);
            setRefreshing(false);
          }}
        >
          {refreshing ? <ActivityIndicator size="small" color={Colors.primary} /> : <Ionicons name="refresh-outline" size={18} color={Colors.text} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setCurrentIndex(0);
              setRefreshing(false);
            }}
            colors={['#FF4B6E']}
            tintColor="#FF4B6E"
          />
        }
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.cardName}>{current?.name}, {current?.age ?? calcAge(current?.dob ?? '')}</Text>
              {current?.isVerified && <Text style={styles.verifiedBadge}>✓</Text>}
              {(current?.isOnline) && <View style={styles.onlineDot} />}
              <View style={{ flex: 1 }} />

            </View>
            {current?.location && (
              <Text style={styles.cardLocation}>📍 {current.location}
                {(() => {
                  const dist = calcDistance(
                    (user as any)?.latitude, (user as any)?.longitude,
                    current?.latitude, current?.longitude
                  );
                  return dist !== null ? `  ·  ${dist} km away` : '';
                })()}
              </Text>
            )}
            {user && current && (() => {
              const score = calculateMatchScore(user as any, current as any);
              const color = getScoreColor(score);
              return (
                <View style={styles.compatBadge}>
                  <Text style={[styles.compatText, { color }]}>{score}% Match</Text>
                </View>
              );
            })()}
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
      </ScrollView>

      {/* Profile Detail Modal */}
      <Modal visible={showProfile} animationType="slide" onRequestClose={() => setShowProfile(false)}
        onShow={async () => {
          // Record profile view
          if (current?.id && user?.id && current.id !== user.id) {
            try {
              const { addDoc, collection: col } = await import('firebase/firestore');
              const { db: fdb } = await import('../../services/firebase');
              await addDoc(col(fdb, 'profileViews'), {
                viewerId: user.id,
                viewerName: user.name,
                viewerPhoto: user.photos?.[0] ?? '',
                viewedId: current.id,
                viewedAt: new Date().toISOString(),
              });
            } catch {}
          }
        }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <ScrollView>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: current?.photos?.[0] }} style={{ width: '100%', height: 400 }} />
              <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportProfileBtn}
                onPress={() => {
                  Alert.alert('Report or Block', `What would you like to do with ${current?.name}?`, [
                    { text: 'Report', onPress: () => {
                      Alert.alert('Reported', `${current?.name} has been reported. Our team will review this.`);
                      reportUser(current?.id, 'reported');
                    }},
                    { text: 'Block', style: 'destructive', onPress: () => {
                      Alert.alert('Blocked', `${current?.name} has been blocked and won't appear again.`);
                      reportUser(current?.id, 'blocked');
                      setShowProfile(false);
                      handleSwipe('pass');
                    }},
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <View style={styles.profileHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{current?.name}, {current?.age}</Text>
                  {current?.location && <Text style={styles.profileLocation}>📍 {current.location}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => {
                    if (current?.id) router.push({ pathname: `/call/${current.id}`, params: { type: 'voice', callerId: user?.id, callerName: user?.name, receiverId: current.id, receiverName: current.name, channelName: `call_${current.id}_${Date.now()}` }} as any);
                  }}
                >
                  <Ionicons name="call-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => {
                    if (current?.id) router.push({ pathname: `/call/${current.id}`, params: { type: 'video', callerId: user?.id, callerName: user?.name, receiverId: current.id, receiverName: current.name, channelName: `call_${current.id}_${Date.now()}` }} as any);
                  }}
                >
                  <Ionicons name="videocam-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              {current?.bio && <Text style={styles.profileBio}>{current.bio}</Text>}

              {/* ── Full Profile Details ── */}
              {[
                { label: 'Gender', value: current?.gender },
                { label: 'Height', value: current?.height ? `${current.height} cm` : null },
                { label: 'Weight', value: current?.weight ? `${current.weight} kg` : null },
                { label: 'Physique', value: current?.physique },
                { label: 'Education', value: current?.education },
                { label: 'Financial situation', value: current?.financialSituation },
                { label: 'Dwelling', value: current?.dwelling },
                { label: 'Car', value: current?.car },
                { label: 'Smoking', value: current?.smoking },
                { label: 'Sociability', value: current?.sociability },
              ].filter(f => f.value).map(({ label, value }) => (
                <View key={label} style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>{label}</Text>
                  <Text style={styles.profileDetailValue}>{value}</Text>
                </View>
              ))}

              {/* Looking For section */}
              {(current?.lookingFor || current?.minAge || current?.maxAge) && (
                <View style={styles.lookingForSection}>
                  <Text style={styles.lookingForTitle}>Looking for</Text>
                  {current?.minAge && current?.maxAge && (
                    <View style={styles.profileDetailRow}>
                      <Text style={styles.profileDetailLabel}>Age</Text>
                      <Text style={styles.profileDetailValue}>From {current.minAge} to {current.maxAge} years</Text>
                    </View>
                  )}
                  {current?.lookingFor && (
                    <View style={styles.profileDetailRow}>
                      <Text style={styles.profileDetailLabel}>Looking for</Text>
                      <Text style={styles.profileDetailValue}>{current.lookingFor}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Icebreakers */}
              {(['ib1','ib2','ib3'] as const).some(k => (current as any)?.[k]) && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.lookingForTitle}>💬 Icebreakers</Text>
                  {[
                    { q: 'Would you rather travel or stay home?', field: 'ib1' },
                    { q: 'Morning person or night owl?', field: 'ib2' },
                    { q: 'Your love language?', field: 'ib3' },
                  ].filter(({ field }) => (current as any)?.[field]).map(({ q, field }) => (
                    <View key={field} style={styles.profileDetailRow}>
                      <Text style={styles.profileDetailLabel}>{q}</Text>
                      <Text style={styles.profileDetailValue}>{(current as any)[field]}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.profileUserId}>ID: {current?.id?.slice(0, 8).toUpperCase()}</Text>
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

              {/* Action buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalPassBtn]}
                  onPress={() => { setShowProfile(false); handleSwipe('pass'); }}
                >
                  <Ionicons name="close" size={24} color="#FF6B6B" />
                  <Text style={[styles.modalActionText, { color: '#FF6B6B' }]}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalFollowBtn]}
                  onPress={async () => {
                    if (!current?.id || !user?.id) return;
                    try {
                      const { followUser } = await import('../../services/followService');
                      await followUser(user.id, user.name || 'Someone', current.id);
                      const mySnap = await getDoc(doc(db, 'users', user.id));
                      if (mySnap.exists()) {
                        setUser({ ...user, followingCount: mySnap.data().followingCount } as any);
                      }
                      Alert.alert('Followed', `You are now following ${current?.name}`);
                    } catch (e: any) {
                      Alert.alert('Follow failed', e.message ?? 'Unknown error');
                    }
                  }}
                >
                  <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
                  <Text style={[styles.modalActionText, { color: Colors.primary }]}>Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalLikeBtn]}
                  onPress={() => { setShowProfile(false); handleSwipe('like'); }}
                >
                  <Ionicons name="heart" size={24} color="#fff" />
                  <Text style={[styles.modalActionText, { color: '#fff' }]}>Like</Text>
                </TouchableOpacity>
              </View>

              {/* Message button */}
              <TouchableOpacity
                style={styles.modalMessageBtn}
                onPress={async () => {
                  setShowProfile(false);
                  if (!current?.id || !user?.id) return;
                  const matchId = await getOrCreateMatch(user.id, current.id);
                  router.push(`/chat/${matchId}`);
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
                <Text style={styles.modalMessageBtnText}>Send a Message</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => handleSwipe('pass')}>
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.undoBtn]} onPress={undoLastSwipe}>
          <Text style={styles.actionIcon}>↩</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.superBtn]} onPress={() => handleSwipe('superlike')}>
          <Text style={styles.actionIcon}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleSwipe('like')}>
          <Text style={styles.actionIcon}>♥</Text>
        </TouchableOpacity>

        {/* Super like animation */}
        {showSuperAnim && (
          <Animated.View style={[styles.superAnimContainer, {
            opacity: superAnim,
            transform: [{ scale: superAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.3, 1] }) }]
          }]}>
            <Text style={styles.superAnimText}>⭐ SUPER LIKE!</Text>
          </Animated.View>
        )}
      </View>

      {/* Filter by interests modal */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 }}>Filter by Interest</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: !filterInterest ? Colors.primary : '#f0f0f0' }}
                onPress={() => { setFilterInterest(null); setShowFilterModal(false); setCurrentIndex(0); }}
              >
                <Text style={{ color: !filterInterest ? '#fff' : Colors.text, fontWeight: '600' }}>All</Text>
              </TouchableOpacity>
              {INTEREST_OPTIONS.map(interest => (
                <TouchableOpacity
                  key={interest}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: filterInterest === interest ? Colors.primary : '#f0f0f0' }}
                  onPress={() => { setFilterInterest(interest); setShowFilterModal(false); setCurrentIndex(0); }}
                >
                  <Text style={{ color: filterInterest === interest ? '#fff' : Colors.text, fontWeight: '600' }}>{interest}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setShowFilterModal(false)}>
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  verifiedBadge: { fontSize: 13, color: '#4FC3F7', fontWeight: '800' as const, backgroundColor: 'rgba(79,195,247,0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  cardLocation: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  cardBio: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: Colors.white, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 16 },
  actionBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 3, backgroundColor: Colors.white },
  passBtn: { borderWidth: 2, borderColor: '#FF6B6B' },
  superBtn: { borderWidth: 2, borderColor: '#FFD700' },
  undoBtn: { borderWidth: 2, borderColor: '#aaa', width: 44, height: 44 },
  superAnimContainer: { position: 'absolute' as const, top: -80, left: 0, right: 0, alignItems: 'center' as const },
  superAnimText: { fontSize: 28, fontWeight: '800' as const, color: '#FFD700', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  likeBtn: { borderWidth: 2, borderColor: '#4CAF50' },
  actionIcon: { fontSize: 26 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  emptyText: { fontSize: 15, color: Colors.textLight },
  resetBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  resetText: { color: Colors.white, fontWeight: Theme.fontWeight.bold, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 20 },
  modalActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 30 },
  modalPassBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#FF6B6B' },
  modalFollowBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.primary },
  modalLikeBtn: { backgroundColor: Colors.primary },
  modalActionText: { fontSize: 15, fontWeight: Theme.fontWeight.bold },
  modalMessageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 30, backgroundColor: '#FFE5EA', marginBottom: 30 },
  modalMessageBtnText: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.primary },
  reportProfileBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 },
  closeProfileBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 },
  profileName: { fontSize: 26, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 4 },
  profileLocation: { fontSize: 15, color: Colors.textLight, marginBottom: 12 },
  profileHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  callIconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFE5EA', alignItems: 'center', justifyContent: 'center' },
  profileBio: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  morePhotosTitle: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 10 },
  morePhoto: { width: 120, height: 160, borderRadius: 12, marginRight: 10 },
  matchModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,75,110,0.96)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 32, overflow: 'hidden' as const },
  matchEmoji: { fontSize: 48, marginBottom: 8 },
  matchPhotos: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: 16 },
  matchPhotoLeft: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff' },
  matchPhotoRight: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff' },
  matchHeart: { fontSize: 28 },
  matchScoreBox: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, marginBottom: 20, alignItems: 'center' as const },
  matchScoreNum: { fontSize: 32, fontWeight: '800' as const },
  matchScoreLabel: { fontSize: 14, color: '#fff', marginTop: 2 },
  matchTitle: { fontSize: 32, fontWeight: Theme.fontWeight.bold, color: Colors.white, marginBottom: 8 },
  matchSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 24, textAlign: 'center' },
  matchPhoto: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: Colors.white, marginBottom: 24 },
  chatBtn: { backgroundColor: Colors.white, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, marginBottom: 12 },
  chatBtnText: { color: Colors.primary, fontWeight: Theme.fontWeight.bold, fontSize: 16 },
  keepBtn: { paddingVertical: 10 },
  keepBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  swipeCounter: { fontSize: 12, color: '#999', fontWeight: '500' as const },
  compatBadge: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' as const, marginTop: 4 },
  compatText: { fontSize: 11, fontWeight: '700' as const },
  profileDetailRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  profileDetailLabel: { fontSize: 16, fontWeight: '600' as const, color: '#1a1a1a', marginBottom: 2 },
  profileDetailValue: { fontSize: 15, color: '#666' },
  lookingForSection: { marginTop: 16, backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12 },
  lookingForTitle: { fontSize: 18, fontWeight: '700' as const, color: '#1a1a1a', marginBottom: 8 },
  profileUserId: { textAlign: 'center' as const, color: '#ccc', fontSize: 12, marginTop: 20, marginBottom: 8 },
});
