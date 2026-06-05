import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Matches() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Matches 💕</Text>
      <View style={styles.center}>
        <Text style={styles.text}>No matches yet</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF4B6E', textAlign: 'center', paddingVertical: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#999', fontSize: 16 },
});
