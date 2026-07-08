path = 'app/(auth)/login.tsx'
with open(path, 'r') as f:
    content = f.read()

old_import = "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously} from 'firebase/auth';"
new_import = "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, sendPasswordResetEmail } from 'firebase/auth';"
content = content.replace(old_import, new_import)

old_guest = """  const handleGuest = async () => {"""
new_guest = """  const handleForgotPassword = async () => {
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

  const handleGuest = async () => {"""
content = content.replace(old_guest, new_guest)

old_switch = """        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }"""

new_switch = """        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
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
  }"""
content = content.replace(old_switch, new_switch)

with open(path, 'w') as f:
    f.write(content)
print("✅ Forgot password added:", old_guest not in content)
