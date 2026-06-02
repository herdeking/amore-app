import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<Props> = ({
  label, onPress, variant = 'primary',
  size = 'md', loading, disabled, style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], styles[size], disabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={variant === 'outline' ? Theme.colors.primary : Theme.colors.white} />
        : <Text style={[styles.label, styles[`${variant}Label`], styles[`${size}Label`]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: Theme.borderRadius.full },
  primary: { backgroundColor: Theme.colors.primary },
  secondary: { backgroundColor: Theme.colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Theme.colors.primary },
  ghost: { backgroundColor: 'transparent' },
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
  disabled: { opacity: 0.5 },
  label: { fontWeight: Theme.fontWeight.semibold },
  primaryLabel: { color: Theme.colors.white },
  secondaryLabel: { color: Theme.colors.white },
  outlineLabel: { color: Theme.colors.primary },
  ghostLabel: { color: Theme.colors.primary },
  smLabel: { fontSize: Theme.fontSize.sm },
  mdLabel: { fontSize: Theme.fontSize.md },
  lgLabel: { fontSize: Theme.fontSize.lg },
});
