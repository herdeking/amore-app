import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileForm } from '../../components/profile/ProfileForm';
import { ProfilePhoto } from '../../components/profile/ProfilePhoto';
import { useAuthStore } from '../../store/authStore';
import { updateProfile } from '../../services/profiles';
import { logOut } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, firebaseUid, setUser } = useAuthStore();
  const router = useRouter();

  const handleSave = async (data: any) => {
    if (!firebaseUid) return;
    try {
      await updateProfile(firebaseUid, data);
      setUser({ ...user, ...data });
      Alert.alert('Saved!', 'Profile updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Profile</Text>
      <ProfilePhoto photos={user?.photos ?? []} onChange={async (photos) => {}} />
      <ProfileForm initial={user ?? undefined} onSave={handleSave} />
      <Button label="Log Out" variant="outline" size="md" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  header: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
});
