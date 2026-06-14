// components/ui/Skeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

export const Skeleton = ({ style }: { style?: ViewStyle }) => {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.skeleton, style, { opacity: anim }]} />;
};

export const SwipeCardSkeleton = () => (
  <View style={styles.card}>
    <Skeleton style={styles.cardImage} />
    <View style={styles.cardInfo}>
      <Skeleton style={styles.nameLine} />
      <Skeleton style={styles.locationLine} />
    </View>
  </View>
);

export const ChatListSkeleton = () => (
  <View>
    {[1,2,3,4,5].map(i => (
      <View key={i} style={styles.chatRow}>
        <Skeleton style={styles.avatar} />
        <View style={styles.chatLines}>
          <Skeleton style={styles.nameLine} />
          <Skeleton style={styles.msgLine} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: { backgroundColor: '#e0e0e0', borderRadius: 8 },
  card: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  cardImage: { width: '100%', height: 420 },
  cardInfo: { padding: 16, gap: 8 },
  nameLine: { height: 22, width: '60%', borderRadius: 6 },
  locationLine: { height: 16, width: '40%', borderRadius: 6 },
  chatRow: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  chatLines: { flex: 1, gap: 8 },
  msgLine: { height: 14, width: '80%', borderRadius: 6 },
});
