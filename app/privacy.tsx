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
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: June 2026</Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.body}>We collect your name, age, date of birth, gender, location, profile photos, bio, interests, usage data, device information, and payment information processed securely by Paystack.</Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.body}>We use your information to show your profile to potential matches, improve our matching algorithm, send push notifications, process payments, ensure platform safety, and provide AI-powered features.</Text>

        <Text style={styles.heading}>3. Data Sharing</Text>
        <Text style={styles.body}>We never sell your personal data. We share limited data only with:\n• Paystack – for secure payment processing\n• Cloudinary – for photo and video storage\n• Firebase (Google) – for database and authentication\n• Anthropic Claude AI – for AI reply suggestions\n• Jitsi – for video and voice calls</Text>

        <Text style={styles.heading}>4. Location Data</Text>
        <Text style={styles.body}>We collect your approximate location to show nearby matches. We never share your exact location with other users. You can disable location access in your device settings at any time.</Text>

        <Text style={styles.heading}>5. Photo & Video Privacy</Text>
        <Text style={styles.body}>Your photos and videos are stored securely on Cloudinary. We use AI to verify uploaded photos for safety purposes. Videos are only visible to users you match with.</Text>

        <Text style={styles.heading}>6. Data Retention</Text>
        <Text style={styles.body}>We retain your data as long as your account is active. When you delete your account, we permanently delete all your personal data within 30 days, except where required by law.</Text>

        <Text style={styles.heading}>7. Children's Privacy</Text>
        <Text style={styles.body}>Amore is strictly for users 18 years and older. We do not knowingly collect data from anyone under 18. If we discover a user is under 18, their account will be immediately terminated.</Text>

        <Text style={styles.heading}>8. Data Security</Text>
        <Text style={styles.body}>We use industry-standard encryption (TLS/SSL) to protect your data in transit. Your password is never stored in plain text. We use Firebase Authentication for secure login.</Text>

        <Text style={styles.heading}>9. Your Rights</Text>
        <Text style={styles.body}>You have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Delete your account and all data\n• Export your data\n• Opt out of marketing notifications\n• Withdraw consent at any time</Text>

        <Text style={styles.heading}>10. Cookies & Tracking</Text>
        <Text style={styles.body}>We use Firebase Analytics to understand how users interact with the app. This data is anonymized and used only to improve the app experience. You can opt out in Settings.</Text>

        <Text style={styles.heading}>11. Third-Party Links</Text>
        <Text style={styles.body}>Our app may contain links to third-party websites. We are not responsible for the privacy practices of these sites and encourage you to review their policies.</Text>

        <Text style={styles.heading}>12. Changes to This Policy</Text>
        <Text style={styles.body}>We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email. Continued use of the app after changes constitutes acceptance.</Text>

        <Text style={styles.heading}>13. Contact Us</Text>
        <Text style={styles.body}>For privacy concerns or data requests:\nEmail: privacy@amore.app\nResponse time: within 72 hours</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  back: { fontSize: 18, color: Colors.primary, fontWeight: "bold" as const },
  title: { fontSize: 18, fontWeight: "bold" as const, color: "#333" },
  content: { padding: 20, paddingBottom: 60 },
  updated: { fontSize: 12, color: "#999", marginBottom: 20, fontStyle: "italic" as const },
  heading: { fontSize: 16, fontWeight: "700" as const, color: "#1a1a1a", marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: "#555", lineHeight: 22 },
});
