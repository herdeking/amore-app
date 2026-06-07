import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../constants/theme';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  isPremium?: boolean;
}

export const ProfilePhoto: React.FC<Props> = ({ photos, onChange, isPremium }) => {
  const maxPhotos = isPremium ? 6 : 2;

  const pick = async (index: number) => {
    if (index >= maxPhotos) {
      Alert.alert(
        'VIP Feature 👑',
        'Upgrade to VIP to add up to 6 photos and get more matches!',
        [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Become VIP 👑', style: 'default' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      onChange(newPhotos);
    }
  };

  return (
    <View>
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <TouchableOpacity key={i} style={styles.cell} onPress={() => pick(i)}>
            {photos[i] ? (
              <Image source={{ uri: photos[i] }} style={styles.photo} />
            ) : (
              <View style={[styles.placeholder, i >= maxPhotos && styles.locked]}>
                {i >= maxPhotos ? (
                  <Text style={styles.lockIcon}>👑</Text>
                ) : (
                  <Text style={styles.plus}>+</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {!isPremium && (
        <Text style={styles.limitText}>Free plan: 2 photos · Upgrade to VIP for 6 photos 👑</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: Theme.spacing.md },
  cell: { width: "31%", aspectRatio: 0.75, borderRadius: Theme.borderRadius.md, overflow: "hidden" },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: "dashed",
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  locked: {
    backgroundColor: "#f9f0ff",
    borderColor: "#ddd",
    opacity: 0.6,
  },
  plus: { fontSize: 28, color: Theme.colors.textLight },
  lockIcon: { fontSize: 22 },
  limitText: { textAlign: "center", fontSize: 12, color: Theme.colors.textLight, marginTop: 4, paddingHorizontal: 16 },
});
