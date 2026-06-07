import React, { useState } from 'react';
import { TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import { auth, db } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';

const TextInputField = ({ field, onSave, onClose }: { field: string; onSave: (f: string, v: string) => void; onClose: () => void }) => {
  const [val, setVal] = React.useState('');
  return (
    <View>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 12 }}
        placeholder={`Enter ${field}`}
        value={val}
        onChangeText={setVal}
        keyboardType={field === 'height' || field === 'weight' ? 'numeric' : 'default'}
        autoFocus
      />
      <TouchableOpacity style={{ padding: 14, backgroundColor: '#FF4B6E', borderRadius: 10, marginBottom: 8 }} onPress={() => onSave(field, val)}>
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const OPTIONS: Record<string, string[]> = {
  gender: ['Male', 'Female', 'Other'],
  purpose: ['Relationship', 'Friendship', 'Casual', 'Marriage'],
  children: ['No children', 'Have children', 'Want children', 'Do not want'],
  smoking: ['Never', 'Occasionally', 'Regularly'],
  alcohol: ['Never', 'Occasionally', 'Regularly'],
  physique: ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus size'],
  education: ['High school', 'College', 'Bachelor', 'Master', 'PhD'],
  financial: ['Modest', 'Average', 'Comfortable', 'Wealthy'],
  dwelling: ['Apartment', 'House', 'With parents', 'Other'],
  car: ['No car', 'Have a car'],
  sociability: ['Introvert', 'Extrovert', 'Ambivert'],
  lookingFor: ['Man', 'Woman', 'Both'],
};

export default function Profile() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await signOut(auth);
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && user) {
      setSaving(true);
      try {
        const uri = result.assets[0].uri;
        const url = await uploadToCloudinary(uri);
        const newPhotos = [url, ...(user.photos ?? []).slice(1)];
        await updateDoc(doc(db, 'users', user.id), { photos: newPhotos });
        setUser({ ...user, photos: newPhotos });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const updateField = async (field: string, value: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { [field]: value });
      setUser({ ...user, [field]: value } as any);
      setEditField(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const Field = ({ label, field, value }: { label: string; field: string; value?: string }) => (
    <View style={styles.field}>
      <View style={styles.fieldLeft}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, !value && styles.incomplete]}>
          {value ?? 'Incomplete'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => setEditField(field)}>
        <Text style={styles.editLink}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Cover + Avatar */}
        <View style={styles.coverSection}>
          <View style={styles.cover} />
          <TouchableOpacity style={styles.photoWrapper} onPress={pickPhoto}>
            {user?.photos?.[0] ? (
              <Image source={{ uri: user.photos[0] }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.amoreLogoText}>💕</Text>
                <Text style={styles.addPhotoText}>Add photo</Text>
              </View>
            )}
            {saving && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Name, gender, ID */}
        <View style={styles.nameSection}>
          <TouchableOpacity onPress={() => setEditField('name')}><Text style={styles.nameText}>{user?.name ?? 'Your Name'} ✏️</Text></TouchableOpacity>
          <Text style={styles.nameSubtext}>
            {user?.gender === 'Male' ? '♂' : user?.gender === 'Female' ? '♀' : '⚧'} {user?.age ?? ''}
            {'  '}ID: {user?.id?.slice(0, 8) ?? '00000000'}
          </Text>
        </View>

        {/* Following / Followers */}
        <View style={styles.followRow}>
          <TouchableOpacity style={styles.followItem}>
            <Text style={styles.followNum}>{user?.followingCount ?? 0}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.followDivider} />
          <TouchableOpacity style={styles.followItem}>
            <Text style={styles.followNum}>{user?.followersCount ?? 0}</Text>
            <Text style={styles.followLabel}>Follower</Text>
          </TouchableOpacity>
        </View>

        {/* Diamonds + VIP */}
        <View style={styles.vipRow}>
          <TouchableOpacity
            style={styles.diamondBtn}
            onPress={() => router.push('/payment')}
          >
            <Text style={styles.diamondIcon}>💎</Text>
            <View>
              <Text style={styles.diamondCount}>{user?.diamonds ?? 0}</Text>
              <Text style={styles.diamondLabel}>Buy diamonds  ›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.vipBtn}
            onPress={() => router.push('/payment')}
          >
            <Text style={styles.vipIcon}>👑</Text>
            <View>
              <Text style={styles.vipTitle}>
                {user?.isPremium ? 'VIP Active ✅' : 'Become VIP'}
              </Text>
              <Text style={styles.vipLabel}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('My Level ⭐', 'You are Level 0. Like profiles and get matches to level up! More features unlock at higher levels.')}>
            <Ionicons name="star-outline" size={22} color={Colors.primary} />
            <Text style={styles.menuText}>My Level</Text>
            <Text style={styles.menuRight}>Lvl 0  ›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('My Backpack 🎒', 'Your backpack is empty. Buy gifts and special items from the store to send to your matches!')}>
            <Ionicons name="bag-outline" size={22} color={Colors.primary} />
            <Text style={styles.menuText}>My Backpack</Text>
            <Text style={styles.menuRight}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={async () => {
            if (user?.isVerified) {
              Alert.alert('Already Verified ✅', 'Your profile is verified!');
              return;
            }
            Alert.alert(
              'Get Verified ✅',
              'Take a selfie matching a pose to verify your identity. Verified profiles get 3x more matches!',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Verify Now', onPress: async () => {
                  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                  if (!result.canceled && user) {
                    Alert.alert('Submitted! ✅', 'Your verification photo has been submitted. We will review it within 24 hours.');
                  }
                }}
              ]
            );
          }}>
            <Text style={styles.menuIcon}>{user?.isVerified ? '✅' : '🔵'}</Text>
            <Text style={styles.menuText}>{user?.isVerified ? 'Verified ✅' : 'Get Verified'}</Text>
            <Text style={styles.menuRight}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={Colors.primary} />
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuRight}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={styles.menuText}>Log Out</Text>
            <Text style={styles.menuRight}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Profile details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Details</Text>
          <Field label="Name" field="name" value={user?.name} />
          <Field label="Gender" field="gender" value={user?.gender} />
          <Field label="Birthday" field="dob" value={user?.dob} />
          <Field label="Location" field="location" value={user?.location} />
          <Field label="About me" field="bio" value={user?.bio} />
          <Field label="Purpose" field="purpose" value={user?.purpose} />
          <Field label="Height" field="height" value={user?.height} />
          <Field label="Weight" field="weight" value={user?.weight} />
          <Field label="Education" field="education" value={user?.education} />
          <Field label="Smoking" field="smoking" value={user?.smoking} />
          <Field label="Alcohol" field="alcohol" value={user?.alcohol} />
          <Field label="Children" field="children" value={user?.children} />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      {editField && (
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Text style={modal.title}>{editField}</Text>
            {OPTIONS[editField] ? (
              OPTIONS[editField].map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[modal.option, (user as any)?.[editField] === opt && modal.selected]}
                  onPress={() => updateField(editField, opt)}
                >
                  <Text style={[modal.optionText, (user as any)?.[editField] === opt && modal.selectedText]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))
            ) : editField === 'dob' ? (
              <DateTimePicker
                value={user?.dob ? new Date(user.dob) : new Date()}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, date) => { if (date) updateField('dob', date.toISOString().split('T')[0]); }}
              />
            ) : (
              <TextInputField field={editField} onSave={updateField} onClose={() => setEditField(null)} />
            )}
            <TouchableOpacity style={modal.cancelBtn} onPress={() => setEditField(null)}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  coverSection: { position: 'relative', marginBottom: 50 },
  cover: { width: '100%', height: 130, backgroundColor: Colors.primary },
  photoWrapper: { position: 'absolute', bottom: -45, alignSelf: 'center', width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.white, overflow: 'hidden', backgroundColor: Colors.surface },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A8C5F0' },
  photoIcon: { fontSize: 24 },
  amoreLogoText: { fontSize: 32, color: '#FF4B6E' },
  addPhotoText: { fontSize: 10, color: Colors.white },
  photoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  settingsBtn: { position: 'absolute', top: 12, right: 16 },
  settingsIcon: { fontSize: 24 },
  nameSection: { alignItems: 'center', marginBottom: 16 },
  nameText: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  nameSubtext: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  followRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12 },
  followItem: { flex: 1, alignItems: 'center' },
  followNum: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  followLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  followDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  vipRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  diamondBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F4FF', borderRadius: 12, padding: 14, gap: 10 },
  diamondIcon: { fontSize: 28 },
  diamondCount: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  diamondLabel: { fontSize: 11, color: Colors.primary },
  vipBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E7', borderRadius: 12, padding: 14, gap: 10 },
  vipIcon: { fontSize: 28 },
  vipTitle: { fontSize: 13, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  vipLabel: { fontSize: 16, color: Colors.textLight },
  menuSection: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  menuIcon: { fontSize: 22, width: 32 },
  menuText: { flex: 1, fontSize: 16, color: Colors.text },
  menuRight: { fontSize: 13, color: Colors.textLight },
  section: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLeft: { flex: 1 },
  fieldLabel: { fontSize: 15, fontWeight: Theme.fontWeight.semibold, color: Colors.text },
  fieldValue: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  incomplete: { fontStyle: 'italic' },
  editLink: { fontSize: 14, color: Colors.primary },
});

const modal = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  box: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 16, textAlign: 'center', textTransform: 'capitalize' },
  option: { padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: '#f5f5f5' },
  selected: { backgroundColor: Colors.primary },
  optionText: { fontSize: 16, color: Colors.text, textAlign: 'center' },
  selectedText: { color: Colors.white, fontWeight: Theme.fontWeight.bold },
  cancelBtn: { padding: 14, marginTop: 4 },
  cancelText: { fontSize: 16, color: Colors.textLight, textAlign: 'center' },
});
