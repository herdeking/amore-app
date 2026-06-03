import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMatches } from '../../hooks/useMatches';
import { MatchList } from '../../components/matches/MatchList';
import { getProfile } from '../../services/auth';
import { User } from '../../types';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches } = useMatches();
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const entries = await Promise.all(
        matches.map(async (m) => {m.users[1]
         const profile = await getProfile(m.users[1]);
          return [m.users[1], profile] as [string, User];
        })
      );
      setUserMap(Object.fromEntries(entries.filter(([, p]) => p)));
    };
    if (matches.length) fetchUsers();
  }, [matches]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Matches</Text>
      <MatchList userMap={userMap} onSelectMatch={(matchId: string) => router.push(`/chat/${matchId}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    padding: Theme.spacing.lg,
  },
});
