import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Swipe() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Amore 💕</Text>
      <View style={styles.center}>
        <Text style={styles.text}>Discover screen coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#FF4B6E', textAlign: 'center', paddingVertical: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#999', fontSize: 16 },
});
