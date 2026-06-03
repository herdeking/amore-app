import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { SwipeDeck } from '../../components/swipe/SwipeDeck';
import { useSwipe } from '../../hooks/useSwipe';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export default function SwipeScreen() {
  const { matched, matchedUser, dismissMatch } = useSwipe();
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discover</Text>
      <SwipeDeck />

      <Modal visible={!!matched} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
          <View style={styles.avatarRow}>
            <Avatar uri={user?.photos?.[0]} name={user?.name} size={90} />
            <Text style={styles.heart}>💖</Text>
            <Avatar uri={matchedUser?.photos?.[0]} name={matchedUser?.name} size={90} />
          </View>
          <Text style={styles.matchSub}>
            You and {matchedUser?.name} liked each other
          </Text>
          <Pressable style={styles.dismissBtn} onPress={dismissMatch}>
            <Text style={styles.dismissText}>Keep Swiping</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    padding: Theme.spacing.lg,
    paddingBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.lg,
    padding: Theme.spacing.xl,
  },
  matchTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  heart: { fontSize: 32 },
  matchSub: {
    color: Colors.textLight,
    fontSize: Theme.fontSize.md,
    textAlign: 'center',
  },
  dismissBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.md,
  },
  dismissText: {
    color: '#fff',
    fontWeight: Theme.fontWeight.bold,
    fontSize: Theme.fontSize.md,
  },
});
