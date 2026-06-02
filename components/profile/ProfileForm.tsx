import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../ui/Button';
import { ProfilePhoto } from './ProfilePhoto';
import { Theme } from '../../constants/theme';
import { User } from '../../types';

interface Props {
  initial?: Partial<User>;
  onSave: (data: Partial<User>) => Promise<void>;
}

export const ProfileForm: React.FC<Props> = ({ initial = {}, onSave }) => {
  const [name, setName] = useState(initial.name ?? '');
  const [age, setAge] = useState(String(initial.age ?? ''));
  const [bio, setBio] = useState(initial.bio ?? '');
  const [location, setLocation] = useState(initial.location ?? '');
  const [photos, setPhotos] = useState<string[]>(initial.photos ?? []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name, age: Number(age), bio, location, photos });
    setSaving(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProfilePhoto photos={photos} onChange={setPhotos} />

      <View style={styles.fields}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={Theme.colors.textLight} />

        <Text style={styles.label}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Age" placeholderTextColor={Theme.colors.textLight} />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bio]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell people about yourself..."
          placeholderTextColor={Theme.colors.textLight}
          multiline
          maxLength={300}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" placeholderTextColor={Theme.colors.textLight} />

        <Button label="Save Profile" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  fields: { padding: Theme.spacing.md, gap: Theme.spacing.sm },
  label: { fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: 4 },
  input: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  bio: { height: 100, textAlignVertical: 'top' },
  saveBtn: { marginTop: Theme.spacing.md },
});
