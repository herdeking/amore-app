import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

export default function Settings() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const { setUser } = useAuthStore();
  const [matches, setMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [showOnline, setShowOnline] = useState(user?.showOnline ?? true);
  const [showDistance2, setShowDistance2] = useState(user?.showDistance ?? true);
  const [showDistance, setShowDistance] = useState(true);
  const [lookingFor, setLookingFor] = useState(user?.lookingFor ?? 'Everyone');
  const [minAge, setMinAge] = useState((user as any)?.minAge ?? 18);
  const [maxAge, setMaxAge] = useState((user as any)?.maxAge ?? 40);
  const [distance, setDistance] = useState((user as any)?.distance ?? 50);

  const saveSetting = async (fields: Record<string, any>) => {
    if (!user) return;
    try {
      const updated = { ...user, ...fields } as any;
      setUser(updated);
      await updateDoc(doc(db, 'users', user.id), fields);
    } catch (e) {
      console.error('Failed to save setting:', e);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await signOut(auth);
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Contact Support', 'Please email support@amore.com to delete your account.') },
      ]
    );
  };

  const Section = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const SettingRow = ({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={Colors.primary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, label, value, onChange }: { icon: any; label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={Colors.primary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.primary }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account */}
        <Section title="Account" />
        <View style={styles.card}>
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => router.push('/(tabs)/profile')} />
          <SettingRow icon="mail-outline" label="Email" value={auth.currentUser?.email ?? 'Not set'} />
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={async () => {
          try {
            const currentUser = auth.currentUser;
            if (currentUser?.email) {
              await sendPasswordResetEmail(auth, currentUser.email);
              Alert.alert('Email Sent ✅', 'Password reset link sent to ' + currentUser.email);
            } else {
              Alert.alert('Error', 'No email found for this account.');
            }
          } catch(e: any) {
            Alert.alert('Error', e.message);
          }
        }} />
          <SettingRow icon="location-outline" label="Location" value={user?.location ?? 'Not set'} />
        </View>

        {/* Discovery */}
        <Section title="Discovery" />
        <View style={styles.card}>
          <SettingRow icon="search-outline" label="Looking for" value={lookingFor} onPress={() => {
            Alert.alert("Looking For", "Who are you looking for?", [
              { text: "Men", onPress: () => { setLookingFor("Men"); saveSetting({lookingFor: "Men"}); } },
              { text: "Women", onPress: () => { setLookingFor("Women"); saveSetting({lookingFor: "Women"}); } },
              { text: "Everyone", onPress: () => { setLookingFor("Everyone"); saveSetting({lookingFor: "Everyone"}); } },
              { text: "Cancel", style: "cancel" },
            ]);
          }} />

          <SettingRow icon="people-outline" label="Age range" value={`${minAge} - ${maxAge}`} onPress={() => {
            Alert.alert("Age Range", "Select age range", [
              { text: "18 - 25", onPress: () => { setMinAge(18); setMaxAge(25); saveSetting({minAge: 18, maxAge: 25}); } },
              { text: "18 - 35", onPress: () => { setMinAge(18); setMaxAge(35); saveSetting({minAge: 18, maxAge: 35}); } },
              { text: "18 - 50", onPress: () => { setMinAge(18); setMaxAge(50); saveSetting({minAge: 18, maxAge: 50}); } },
              { text: "18 - 70", onPress: () => { setMinAge(18); setMaxAge(70); saveSetting({minAge: 18, maxAge: 70}); } },
              { text: "Cancel", style: "cancel" },
            ]);
          }} />
          <SettingRow icon="navigate-outline" label="Max distance" value={distance === 999 ? "Worldwide" : `${distance} km`} onPress={() => {
            Alert.alert("Max Distance", "Select max distance", [
              { text: "10 km", onPress: () => { setDistance(10); saveSetting({distance: 10}); } },
              { text: "25 km", onPress: () => { setDistance(25); saveSetting({distance: 25}); } },
              { text: "50 km", onPress: () => { setDistance(50); saveSetting({distance: 50}); } },
              { text: "100 km", onPress: () => { setDistance(100); saveSetting({distance: 100}); } },
              { text: "Cancel", style: "cancel" },
            ]);
          }} />
          <ToggleRow icon="eye-outline" label="Show me online" value={showOnline} onChange={setShowOnline} />
          <ToggleRow icon="location-outline" label="Show distance" value={showDistance} onChange={setShowDistance} />
        </View>

        {/* Notifications */}
        <Section title="Notifications" />
        <View style={styles.card}>
          <ToggleRow icon="notifications-outline" label="Push notifications" value={notifications} onChange={setNotifications} />
          <ToggleRow icon="heart-outline" label="New matches" value={matches} onChange={setMatches} />
          <ToggleRow icon="chatbubble-outline" label="New messages" value={messages} onChange={setMessages} />
        </View>

        {/* Premium */}
        <Section title="Premium" />
        <View style={styles.card}>
          <SettingRow icon="star-outline" label="VIP Status" value={user?.isPremium ? 'Active ✅' : 'Not active'} onPress={() => router.push('/payment')} />
          <SettingRow icon="diamond-outline" label="Diamonds" value={`${user?.diamonds ?? 0} 💎`} onPress={() => router.push('/payment')} />
        </View>

        {/* Support */}
        <Section title="Support" />
        <View style={styles.card}>
          <SettingRow icon="help-circle-outline" label="Help Center" onPress={() => Alert.alert('Help', 'Email: support@amore.com')} />
          <SettingRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/terms')} />
          <SettingRow icon="shield-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} />
          <SettingRow icon="star-outline" label="Rate the app" onPress={() => Alert.alert('Rate Us', 'Thank you for your support!')} />
        </View>

        {/* Danger zone */}
        <Section title="Account Actions" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <Text style={styles.rowIcon}>🚪</Text>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount}>
            <Text style={styles.rowIcon}>🗑️</Text>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Amore v1.0.0 · Made with ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  content: { padding: 16, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: Theme.fontWeight.bold, color: Colors.textLight, paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  rowIcon: { marginRight: 4, width: 28 },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
  rowValue: { fontSize: 13, color: Colors.textLight },
  rowArrow: { fontSize: 18, color: Colors.textLight },
  logoutRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  logoutText: { fontSize: 15, color: Colors.primary, fontWeight: Theme.fontWeight.semibold },
  deleteRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  deleteText: { fontSize: 15, color: '#FF3B30', fontWeight: Theme.fontWeight.semibold },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 16, marginBottom: 32 },
});
