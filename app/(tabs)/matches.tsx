import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MatchList from '../../components/matches/MatchList';
import { useMatches } from '../../hooks/useMatches';

export default function Matches() {
  const { matches } = useMatches();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Matches 💕</Text>
      <MatchList matches={matches} userMap={{}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF4B6E', textAlign: 'center', paddingVertical: 12 },
});
