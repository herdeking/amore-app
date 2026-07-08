import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Dimensions, Image, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

const { width, height } = Dimensions.get('window');

const GRID_PHOTOS = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/women/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'https://randomuser.me/api/portraits/women/9.jpg',
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'main' | 'login' | 'register'>('main');

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/onboarding');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Please enter your email address first, then tap "Forgot Password" again.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email Sent ✅', `A password reset link has been sent to ${email}. Please check your inbox.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'login' || mode === 'register') {
    return (
      <View style={styles.formContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('main')}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>{mode === 'login' ? 'Welcome Back 💕' : 'Join Amore 💕'}</Text>
        <Text style={styles.formSubtitle}>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={{ position: 'absolute', right: 16 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
        {mode === 'login' && (
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={[styles.switchText, { marginTop: 10, fontSize: 14 }]}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Photo grid background */}
      <View style={styles.gridBg}>
        {GRID_PHOTOS.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.gridPhoto} />
        ))}
      </View>

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💕</Text>
          </View>
          <Text style={styles.appName}>AMORE</Text>
          <Text style={styles.tagline}>Find your perfect match</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.googleBtn} onPress={() => setMode('login')}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Sign In with Email</Text>
            <View style={styles.lastLogin}>
              <Text style={styles.lastLoginText}>Last login</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
            <Text style={styles.guestIcon}>👤</Text>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.phoneBtn} onPress={() => setMode('register')}>
            <Text style={styles.phoneIcon}>📱</Text>
            <Text style={styles.phoneText}>Create Account with Email</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By using Amore, you agree to the{' '}
            <Text style={styles.termsLink}>Terms of Use</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gridBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' },
  gridPhoto: { width: width / 3, height: height / 3, resizeMode: 'cover' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  content: { flex: 1, justifyContent: 'space-between', paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginTop: height * 0.18 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', marginBottom: 12 },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  buttons: { paddingHorizontal: 24, gap: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 32, paddingVertical: 14, paddingHorizontal: 20, gap: 12 },
  googleIcon: { fontSize: 20, fontWeight: '900', color: '#4285F4', width: 28, textAlign: 'center' },
  googleText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '600' },
  lastLogin: { backgroundColor: '#333', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  lastLoginText: { fontSize: 11, color: '#fff' },
  guestBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5A623', borderRadius: 32, paddingVertical: 14, paddingHorizontal: 20, gap: 12 },
  guestIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  guestText: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '600' },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 32, paddingVertical: 14, paddingHorizontal: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  phoneIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  phoneText: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '600' },
  terms: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 },
  termsLink: { textDecorationLine: 'underline', color: '#fff' },
  formContainer: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 52, left: 20 },
  backText: { fontSize: 18, color: '#FF4B6E' },
  formTitle: { fontSize: 28, fontWeight: '900', color: '#333', marginBottom: 8 },
  formSubtitle: { fontSize: 16, color: '#999', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 16, color: '#333', marginBottom: 16, backgroundColor: '#f9f9f9' },
  primaryBtn: { backgroundColor: '#FF4B6E', borderRadius: 32, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  switchText: { textAlign: 'center', color: '#FF4B6E', marginTop: 20, fontSize: 15 },
});
