import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Badge } from '../ui/Badge';
import { Theme } from '../../constants/theme';
import { User } from '../../types';

const { width, height } = Dimensions.get('window');

interface Props {
  user: User;
  isTop?: boolean;
}

export const SwipeCard: React.FC<Props> = ({ user, isTop }) => (
  <View style={[styles.card, isTop && styles.topCard]}>
    <Image source={{ uri: user.photos[0] }} style={styles.image} />
    <View style={styles.overlay}>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.age}>{user.age}</Text>
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
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { fontSize: Theme.fontSize.xxl, fontWeight: Theme.fontWeight.bold, color: Theme.colors.white },
  age: { fontSize: Theme.fontSize.xl, color: Theme.colors.white, opacity: 0.9 },
  location: { fontSize: Theme.fontSize.sm, color: Theme.colors.white, opacity: 0.8, marginTop: 2 },
  bio: { fontSize: Theme.fontSize.sm, color: Theme.colors.white, opacity: 0.85, marginTop: 6 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
});
