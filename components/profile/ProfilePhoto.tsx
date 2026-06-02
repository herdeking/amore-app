import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../constants/theme';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export const ProfilePhoto: React.FC<Props> = ({ photos, onChange }) => {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      onChange([...photos, ...uris].slice(0, 6));
    }
  };

  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <TouchableOpacity key={i} style={styles.cell} onPress={pick}>
          {photos[i]
            ? <Image source={{ uri: photos[i] }} style={styles.photo} />
            : (
              <View style={styles.placeholder}>
                <Text style={styles.plus}>+</Text>
              </View>
            )
          }
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: Theme.spacing.md },
  cell: { width: '31%', aspectRatio: 0.75, borderRadius: Theme.borderRadius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontSize: 28, color: Theme.colors.textLight },
});
