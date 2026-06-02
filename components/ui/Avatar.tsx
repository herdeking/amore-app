import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

interface Props {
  uri?: string;
  name?: string;
  size?: number;
  showOnline?: boolean;
}

export const Avatar: React.FC<Props> = ({ uri, name, size = 48, showOnline }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <View style={{ width: size, height: size }}>
      {uri
        ? <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
        : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
          </View>
        )
      }
      {showOnline && (
        <View style={[styles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, bottom: 0, right: 0 }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: {
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: Theme.colors.white, fontWeight: Theme.fontWeight.bold },
  onlineDot: {
    position: 'absolute',
    backgroundColor: Theme.colors.success,
    borderWidth: 2,
    borderColor: Theme.colors.white,
  },
});
