import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Badge } from '../ui/Badge';
import { Theme } from '../../constants/theme';
import { User } from '../../types';
import { watchPresence } from '../../services/presence';
import { calculateMatchScore, getScoreColor, getScoreLabel } from '../../services/matchScore';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

interface Props {
  user: User;
  isTop?: boolean;
}

export const SwipeCard: React.FC<Props> = ({ user, isTop }) => {
  const [isOnline, setIsOnline] = useState(user.isOnline ?? false);
  const { user: currentUser } = useAuthStore();
  const matchScore = currentUser ? calculateMatchScore(currentUser as any, user) : 0;
  const scoreColor = getScoreColor(matchScore);
  const scoreLabel = getScoreLabel(matchScore);

  useEffect(() => {
    const unsubscribe = watchPresence(user.id, setIsOnline);
    return unsubscribe;
  }, [user.id]);

  return (
    <View style={[styles.card, isTop && styles.topCard]}>
      <Image source={{ uri: user.photos[0] }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.age}>{user.age}</Text>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#4CAF50' : '#aaa' }]} />
          </View>
          {isOnline
            ? <Text style={styles.onlineText}>● Online now</Text>
            : <Text style={styles.onlineText}>○ Offline</Text>
          }
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={{ backgroundColor: scoreColor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{matchScore}% {scoreLabel}</Text>
            </View>
            {user.isVerified && (
              <View style={{ backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>✅ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.location}>📍 {user.location}</Text>
          {user.bio ? <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text> : null}
          <View style={styles.interests}>
            {(user.interests ?? []).slice(0, 3).map(tag => (
              <Badge key={tag} label={tag} color="rgba(255,255,255,0.25)" textColor={Theme.colors.white} size="sm" />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    height: height * 0.68,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surface,
    ...Theme.shadow.lg,
  },
  topCard: { zIndex: 10 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  info: { padding: Theme.spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Theme.colors.white },
  age: { fontSize: Theme.fontSize.xl, color: Theme.colors.white, opacity: 0.9 },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 2 },
  location: { fontSize: Theme.fontSize.sm, color: Theme.colors.white, opacity: 0.8, marginTop: 2 },
  bio: { fontSize: Theme.fontSize.sm, color: Theme.colors.white, opacity: 0.85, marginTop: 6 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
});
