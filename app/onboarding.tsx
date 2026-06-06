import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../services/cloudinary';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

const steps = ['Name', 'Birthday', 'Bio', 'Photos'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris].slice(0, 6));
    }
  };

  const uploadPhoto = async (uri: string, index: number): Promise<string> => {
    return await uploadToCloudinary(uri);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not logged in');

      const uploadedPhotos = await Promise.all(
        photos.map((uri, i) => uploadPhoto(uri, i))
      );

      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name,
        dob,
        bio,
        photos: uploadedPhotos,
        createdAt: new Date().toISOString(),
        onboardingComplete: true,
      });

      router.replace('/(tabs)/swipe');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step === 0 && !name.trim()) return Alert.alert('Enter your name');
    if (step === 1 && !dob.trim()) return Alert.alert('Enter your birthday');
    if (step === 3 && photos.length === 0) return Alert.alert('Add at least one photo');
    if (step < steps.length - 1) setStep(step + 1);
    else saveProfile();
  };

  const back = () => { if (step > 0) setStep(step - 1); };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.progressDot, i <= step && styles.progressActive]} />
        ))}
      </View>

      <Text style={styles.title}>{steps[step]}</Text>

      {step === 0 && (
        <>
          <Text style={styles.subtitle}>What\'s your name?</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.subtitle}>When\'s your birthday?</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            value={dob}
            onChangeText={setDob}
            keyboardType="numeric"
            maxLength={10}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.subtitle}>Write a short bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell people about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.subtitle}>Add your best photos</Text>
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={styles.addPhoto} onPress={pickPhoto}>
                <Text style={styles.addPhotoText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.photoHint}>{photos.length}/6 photos</Text>
        </>
      )}

      <View style={styles.buttons}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={back} disabled={saving}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={next} disabled={saving}>
          {saving
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.nextText}>
                {step === steps.length - 1 ? "Let\'s Go 🔥" : 'Next'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: Colors.background },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 24, marginTop: 40 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  title: { fontSize: Theme.fontSize.title, fontWeight: Theme.fontWeight.bold, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: Theme.fontSize.md, color: Colors.textLight, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: Theme.fontSize.md, color: Colors.text, backgroundColor: Colors.surface },
  bioInput: { height: 120, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', color: Colors.textLight, fontSize: Theme.fontSize.sm, marginTop: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: 100, height: 100, borderRadius: 12 },
  addPhoto: { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { fontSize: 36, color: Colors.textLight },
  photoHint: { color: Colors.textLight, fontSize: Theme.fontSize.sm, marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  backText: { color: Colors.text, fontWeight: Theme.fontWeight.semibold },
  nextBtn: { flex: 2, padding: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  nextText: { color: Colors.white, fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.md },
});
