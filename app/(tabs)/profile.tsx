import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { logOut } from '../../services/auth';

export default function Profile() {
  const router = useRouter();
  const handleLogout = async () => {
    try { await logOut(); router.replace('/(auth)/login'); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log Out</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.center}>
        <Text style={styles.text}>Profile coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF4B6E' },
  logout: { color: '#999', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#999', fontSize: 16 },
});
