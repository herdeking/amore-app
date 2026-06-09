import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: June 2026</Text>
        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.body}>We collect your name, age, gender, location, profile photos, bio, usage data, device information, and payment information processed securely by Paystack.</Text>
        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.body}>We use your information to show your profile to potential matches, improve our matching algorithm, send notifications, process payments, and ensure safety.</Text>
        <Text style={styles.heading}>3. Data Sharing</Text>
        <Text style={styles.body}>We never sell your personal data. We share limited data only with Paystack for payments, Cloudinary for photo storage, Firebase for database, and Anthropic Claude AI for AI reply features.</Text>
        <Text style={styles.heading}>4. Photo Privacy</Text>
        <Text style={styles.body}>Your photos are stored securely on Cloudinary. We use AI to verify that uploaded photos match your registered gender for safety purposes.</Text>
        <Text style={styles.heading}>5. Data Security</Text>
        <Text style={styles.body}>We use industry-standard encryption to protect your data. Your password is never stored in plain text. We use Firebase Authentication for secure login.</Text>
        <Text style={styles.heading}>6. Your Rights</Text>
        <Text style={styles.body}>You have the right to access your personal data, delete your account and data, update your information anytime, and opt out of notifications.</Text>
        <Text style={styles.heading}>7. Contact</Text>
        <Text style={styles.body}>For privacy concerns, contact us at: privacy@amore.app</Text>
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
