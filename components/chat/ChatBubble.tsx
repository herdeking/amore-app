import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { Message } from '../../types';

interface Props {
  message: Message;
  isOwn: boolean;
}

export const ChatBubble: React.FC<Props> = ({ message, isOwn }) => (
  <View style={[styles.row, isOwn && styles.rowOwn]}>
    <View style={[styles.bubble, isOwn ? styles.own : styles.other]}>
      <Text style={[styles.text, isOwn && styles.textOwn]}>{message.text}</Text>
      <Text style={[styles.time, isOwn && styles.timeOwn]}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: Theme.spacing.md },
  rowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  own: { backgroundColor: Theme.colors.primary, borderBottomRightRadius: 4 },
  other: { backgroundColor: Theme.colors.surface, borderBottomLeftRadius: 4 },
  text: { fontSize: Theme.fontSize.md, color: Theme.colors.text },
  textOwn: { color: Theme.colors.white },
  time: { fontSize: Theme.fontSize.xs, color: Theme.colors.textLight, marginTop: 2, alignSelf: 'flex-end' },
  timeOwn: { color: 'rgba(255,255,255,0.7)' },
});
