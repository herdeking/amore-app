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
        <Text style={styles.body}>By downloading or using Amore, you agree to be bound by these Terms of Service and our Privacy Policy.</Text>
        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.body}>You must be at least 18 years old to use Amore.</Text>
        <Text style={styles.heading}>3. Account Responsibility</Text>
        <Text style={styles.body}>You are responsible for maintaining the confidentiality of your account. You may not create multiple accounts.</Text>
        <Text style={styles.heading}>4. User Conduct</Text>
        <Text style={styles.body}>You agree not to post false information, upload photos that are not of yourself, harass other users, use the app for commercial purposes, share explicit content, impersonate others, or use bots.</Text>
        <Text style={styles.heading}>5. Photos and Content</Text>
        <Text style={styles.body}>All photos must be of yourself. Our AI detects inappropriate content. Violations may result in permanent account suspension.</Text>
        <Text style={styles.heading}>6. Premium Features and Payments</Text>
        <Text style={styles.body}>VIP subscriptions are processed through Paystack. Payments are non-refundable. VIP benefits are granted immediately. Diamond purchases are non-refundable.</Text>
        <Text style={styles.heading}>7. Diamonds and Virtual Currency</Text>
        <Text style={styles.body}>Diamonds are virtual currency with no real-world monetary value and cannot be exchanged for cash. Unused diamonds are forfeited upon account deletion.</Text>
        <Text style={styles.heading}>8. Safety and Reporting</Text>
        <Text style={styles.body}>You can report any user who violates these terms. We review all reports within 48 hours. False reports may result in account suspension.</Text>
        <Text style={styles.heading}>9. Account Termination</Text>
        <Text style={styles.body}>We may suspend or terminate your account for violations. You may delete your account anytime through Settings.</Text>
        <Text style={styles.heading}>10. Disclaimer</Text>
        <Text style={styles.body}>Amore is provided as-is. We do not guarantee matches or that profiles are accurate.</Text>
        <Text style={styles.heading}>11. Governing Law</Text>
        <Text style={styles.body}>These terms are governed by the laws of the Federal Republic of Nigeria.</Text>
        <Text style={styles.heading}>12. Contact Us</Text>
        <Text style={styles.body}>Email: support@amore.app</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  back: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, paddingBottom: 60 },
  updated: { fontSize: 12, color: '#999', marginBottom: 20, fontStyle: 'italic' },
  heading: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: '#555', lineHeight: 22 },
});
