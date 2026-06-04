import { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeDeck from '../../components/swipe/SwipeDeck';
import { useSwipe } from '../../hooks/useSwipe';
import { TouchableOpacity } from 'react-native';

export default function Swipe() {
  const { matched, matchedUser, clearMatch } = useSwipe();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Amore 💕</Text>
      <SwipeDeck />

      <Modal visible={!!matched} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
            <Text style={styles.matchSub}>You and {matchedUser?.name} liked each other</Text>
            <TouchableOpacity style={styles.matchBtn} onPress={clearMatch}>
              <Text style={styles.matchBtnText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#FF4B6E', textAlign: 'center', paddingVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '80%' },
  matchTitle: { fontSize: 28, fontWeight: 'bold', color: '#FF4B6E', marginBottom: 8 },
  matchSub: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  matchBtn: { backgroundColor: '#FF4B6E', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center' },
  matchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
