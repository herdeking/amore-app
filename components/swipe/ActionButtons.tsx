import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

interface Props {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  disabled?: boolean;
}

export const ActionButtons: React.FC<Props> = ({ onPass, onLike, onSuperLike, disabled }) => (
  <View style={styles.row}>
    <TouchableOpacity onPress={onPass} disabled={disabled} style={[styles.btn, styles.pass]}>
      <Text style={styles.icon}>✕</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={onSuperLike} disabled={disabled} style={[styles.btn, styles.superlike, styles.small]}>
      <Text style={[styles.icon, styles.smallIcon]}>★</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={onLike} disabled={disabled} style={[styles.btn, styles.like]}>
      <Text style={styles.icon}>♥</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
    ...Theme.shadow.md,
  },
  small: { width: 48, height: 48, borderRadius: 24 },
  pass: { borderWidth: 2, borderColor: Theme.colors.pass },
  like: { borderWidth: 2, borderColor: Theme.colors.like },
  superlike: { borderWidth: 2, borderColor: Theme.colors.superlike },
  icon: { fontSize: 26 },
  smallIcon: { fontSize: 20 },
});
