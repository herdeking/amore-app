import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { MatchCard } from './MatchCard';
import { useMatches } from '../../hooks/useMatches';
import { Theme } from '../../constants/theme';

interface Props {
  userMap: Record<string, any>;
  onSelectMatch: (matchId: string) => void;
}

export const MatchList: React.FC<Props> = ({ userMap, onSelectMatch }) => {
  const { matches } = useMatches();

  if (!matches.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💫</Text>
        <Text style={styles.emptyText}>No matches yet</Text>
        <Text style={styles.emptySubtext}>Keep swiping to find your match!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={m => m.id}
      renderItem={({ item }) => {
        const other = userMap[item.users.find(u => u !== item.users[0]) ?? ''];
        if (!other) return null;
        return <MatchCard match={item} otherUser={other} onPress={() => onSelectMatch(item.id)} />;
      }}
    />
  );
};

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Theme.spacing.md },
  emptyText: { fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text },
  emptySubtext: { fontSize: Theme.fontSize.sm, color: Theme.colors.textLight, marginTop: 4, textAlign: 'center' },
});
