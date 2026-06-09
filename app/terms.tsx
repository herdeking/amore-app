import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: June 2026</Text>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>By downloading or using Amore, you agree to be bound by these Terms of Service. If you do not agree, please do not use our app.</Text>
        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.body}>You must be at least 18 years old to use Amore. By using the app, you confirm that you are 18 or older.</Text>
        <Text style={styles.heading}>3. User Conduct</Text>
        <Text style={styles.body}>You agree not to post false information, upload photos that are not of yourself, harass other users, use the app for commercial purposes, or share explicit content.</Text>
        <Text style={styles.heading}>4. Photos and Content</Text>
        <Text style={styles.body}>All photos uploaded must be of yourself. Our AI system automatically detects and rejects photos that do not match your registered gender. Violation may result in permanent account suspension.</Text>
        <Text style={styles.heading}>5. Premium Features</Text>
        <Text style={styles.body}>Amore offers free and VIP premium plans. VIP subscriptions are billed through Paystack. Refunds are not available for partially used subscription periods.</Text>
        <Text style={styles.heading}>6. Account Termination</Text>
        <Text style={styles.body}>We reserve the right to suspend or terminate your account at any time for violations of these terms. You may also delete your account at any time through Settings.</Text>
        <Text style={styles.heading}>7. Contact</Text>
        <Text style={styles.body}>For questions about these terms, contact us at: support@amore.app</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  back: { fontSize: 18, color: Colors.primary, fontWeight: "bold" },
  title: { fontSize: 18, fontWeight: "bold", color: "#333" },
  content: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: "#999", marginBottom: 20, fontStyle: "italic" },
  heading: { fontSize: 16, fontWeight: "bold", color: "#333", marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: "#555", lineHeight: 22 },
});
