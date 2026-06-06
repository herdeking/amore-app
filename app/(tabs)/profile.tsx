import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Image, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import { auth, db } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export default function Profile() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);

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

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), { name, bio });
      setUser({ ...user, name, bio });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Photo */}
        <TouchableOpacity style={styles.photoContainer} onPress={pickPhoto}>
          {user?.photos?.[0] ? (
            <Image source={{ uri: user.photos[0] }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
            </View>
          )}
          {saving && (
            <View style={styles.photoOverlay}>
              <ActivityIndicator color={Colors.white} />
            </View>
          )}
          <View style={styles.editPhotoBtn}>
            <Text style={styles.editPhotoText}>✏️</Text>
          </View>
        </TouchableOpacity>

        {/* Name & info */}
        {editing ? (
          <View style={styles.editSection}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              multiline
              maxLength={200}
            />
            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.name}>{user?.name ?? 'Your Name'}</Text>
            {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {/* Photo grid */}
        {(user?.photos?.length ?? 0) > 1 && (
          <View style={styles.photoGrid}>
            <Text style={styles.sectionTitle}>My Photos</Text>
            <View style={styles.grid}>
              {user?.photos?.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.gridPhoto} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: Theme.fontWeight.bold, color: Colors.primary },
  logout: { color: Colors.textLight, fontSize: Theme.fontSize.sm },
  content: { alignItems: 'center', padding: 20 },
  photoContainer: { position: 'relative', marginBottom: 20 },
  photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: Colors.primary },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border },
  photoIcon: { fontSize: 40 },
  photoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  editPhotoBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  editPhotoText: { fontSize: 14 },
  infoSection: { alignItems: 'center', marginBottom: 24 },
  name: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 8 },
  bio: { fontSize: Theme.fontSize.md, color: Colors.textLight, textAlign: 'center', marginBottom: 16 },
  editBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 10, borderRadius: 24 },
  editBtnText: { color: Colors.white, fontWeight: Theme.fontWeight.semibold },
  editSection: { width: '100%', marginBottom: 24 },
  label: { fontSize: Theme.fontSize.sm, color: Colors.textLight, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: Theme.fontSize.md, color: Colors.text, backgroundColor: Colors.surface },
  bioInput: { height: 100, textAlignVertical: 'top' },
  editBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelText: { color: Colors.text, fontWeight: Theme.fontWeight.semibold },
  saveBtn: { flex: 2, padding: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  saveText: { color: Colors.white, fontWeight: Theme.fontWeight.bold },
  stats: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, padding: 20, width: '100%', marginBottom: 24 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold, color: Colors.primary },
  statLabel: { fontSize: Theme.fontSize.xs, color: Colors.textLight, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  photoGrid: { width: '100%' },
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridPhoto: { width: 100, height: 100, borderRadius: 12 },
});
