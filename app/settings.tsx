import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

export default function Settings() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [matches, setMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

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

  const SettingRow = ({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Text style={styles.rowArrow}>›</Text>
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, label, value, onChange }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
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
          <SettingRow icon="👤" label="Edit Profile" onPress={() => router.push('/(tabs)/profile')} />
          <SettingRow icon="📧" label="Email" value={user?.id?.slice(0, 12) + '...'} />
          <SettingRow icon="🔒" label="Change Password" onPress={async () => {
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
          <SettingRow icon="📍" label="Location" value={user?.location ?? 'Not set'} />
        </View>

        {/* Discovery */}
        <Section title="Discovery" />
        <View style={styles.card}>
          <SettingRow icon="🔍" label="Looking for" value={user?.lookingFor ?? 'Everyone'} onPress={() => Alert.alert('Looking For', 'Who are you looking for?', [
              {text: 'Men', onPress: () => {}},
              {text: 'Women', onPress: () => {}},
              {text: 'Everyone', onPress: () => {}},
              {text: 'Cancel', style: 'cancel'}
            ])} />
          <SettingRow icon="📏" label="Age range" value="18 - 40" onPress={() => Alert.alert('Age Range', 'Age range filter will be fully interactive in the next update. Currently set to 18-40.')} />
          <SettingRow icon="📡" label="Max distance" value="50 km" onPress={() => Alert.alert('Max Distance', 'Distance filter will be fully interactive in the next update. Currently set to 50km.')} />
          <ToggleRow icon="👁" label="Show me online" value={showOnline} onChange={setShowOnline} />
          <ToggleRow icon="📍" label="Show distance" value={showDistance} onChange={setShowDistance} />
        </View>

        {/* Notifications */}
        <Section title="Notifications" />
        <View style={styles.card}>
          <ToggleRow icon="🔔" label="Push notifications" value={notifications} onChange={setNotifications} />
          <ToggleRow icon="💕" label="New matches" value={matches} onChange={setMatches} />
          <ToggleRow icon="💬" label="New messages" value={messages} onChange={setMessages} />
        </View>

        {/* Premium */}
        <Section title="Premium" />
        <View style={styles.card}>
          <SettingRow icon="👑" label="VIP Status" value={user?.isPremium ? 'Active ✅' : 'Not active'} onPress={() => router.push('/payment')} />
          <SettingRow icon="💎" label="Diamonds" value={`${user?.diamonds ?? 0} 💎`} onPress={() => router.push('/payment')} />
        </View>

        {/* Support */}
        <Section title="Support" />
        <View style={styles.card}>
          <SettingRow icon="❓" label="Help Center" onPress={() => Alert.alert('Help', 'Email: support@amore.com')} />
          <SettingRow icon="📝" label="Terms of Service" onPress={() => Alert.alert('Terms', 'By using Amore you agree to our terms.')} />
          <SettingRow icon="🔐" label="Privacy Policy" onPress={() => Alert.alert('Privacy', 'We protect your data.')} />
          <SettingRow icon="⭐" label="Rate the app" onPress={() => Alert.alert('Rate Us', 'Thank you for your support!')} />
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
  rowIcon: { fontSize: 20, width: 30 },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
  rowValue: { fontSize: 13, color: Colors.textLight },
  rowArrow: { fontSize: 18, color: Colors.textLight },
  logoutRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  logoutText: { fontSize: 15, color: Colors.primary, fontWeight: Theme.fontWeight.semibold },
  deleteRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  deleteText: { fontSize: 15, color: '#FF3B30', fontWeight: Theme.fontWeight.semibold },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 16, marginBottom: 32 },
});
