import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Fill in all fields.');
    setLoading(true);
    try {
      await signUp(email, password, name);
      router.replace('/(tabs)/swipe');
    } catch (e: any) {
      Alert.alert('Signup failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create Account 💖</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor={Colors.textLight}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.textLight}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.textLight}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        label={loading ? 'Creating account...' : 'Sign Up'}
        variant="primary"
        size="lg"
        onPress={handleSignup}
        disabled={loading}
      />
      <Text style={styles.link} onPress={() => router.back()}>
        Already have an account? <Text style={styles.linkBold}>Sign in</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Theme.spacing.lg,
    justifyContent: 'center',
    gap: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginBottom: Theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    color: Colors.text,
    fontSize: Theme.fontSize.md,
  },
  link: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: Theme.spacing.sm,
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.bold,
  },
});
