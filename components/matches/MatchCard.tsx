import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Theme } from '../../constants/theme';
import { Match, User } from '../../types';

interface Props {
  match: Match;
  otherUser: User;
  onPress: () => void;
}

export const MatchCard: React.FC<Props> = ({ match, otherUser, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    <Avatar uri={otherUser.photos[0]} name={otherUser.name} size={56} showOnline />
    <View style={styles.info}>
      <Text style={styles.name}>{otherUser.name}</Text>
      {match.lastMessage
        ? <Text style={styles.preview} numberOfLines={1}>{match.lastMessage.text}</Text>
        : <Text style={styles.new}>New match! Say hello 👋</Text>
      }
    </View>
    {match.unreadCount ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{match.unreadCount}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    gap: Theme.spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text },
  preview: { fontSize: Theme.fontSize.sm, color: Theme.colors.textLight, marginTop: 2 },
  new: { fontSize: Theme.fontSize.sm, color: Theme.colors.primary, marginTop: 2 },
  badge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: Theme.colors.white, fontSize: Theme.fontSize.xs, fontWeight: Theme.fontWeight.bold },
});
