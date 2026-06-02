import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

interface Props {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<Props> = ({
  label,
  color = Theme.colors.primary,
  textColor = Theme.colors.white,
  size = 'md',
}) => (
  <View style={[styles.badge, styles[size], { backgroundColor: color }]}>
    <Text style={[styles.label, styles[`${size}Label`], { color: textColor }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { borderRadius: Theme.borderRadius.full, alignSelf: 'flex-start' },
  sm: { paddingVertical: 2, paddingHorizontal: 8 },
  md: { paddingVertical: 4, paddingHorizontal: 12 },
  label: { fontWeight: Theme.fontWeight.semibold },
  smLabel: { fontSize: Theme.fontSize.xs },
  mdLabel: { fontSize: Theme.fontSize.sm },
});
