/**
 * HawkMaps · src/app/login.tsx
 *
 * Sign-in screen. Only Laurier accounts (@mylaurier.ca / @wlu.ca) can
 * sign in — validation happens in useAuth() and again on the backend.
 * On success the auth guard in src/app/_layout.tsx automatically
 * switches to the (tabs) app, landing on the Map home tab.
 */

import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // Success — the root layout's auth guard swaps to (tabs) automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header wordmark */}
        <Text style={styles.headerLogo}>L O G O</Text>

        {/* Avatar placeholder */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>

        {/* Credentials */}
        <View style={styles.form}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Username:</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="you@mylaurier.ca"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Password:</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              onSubmitEditing={handleSignIn}
              returnKeyType="go"
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.signInText}>SIGN IN</Text>}
          </TouchableOpacity>

          {/* Links */}
          <TouchableOpacity
            onPress={() => {
              const title = 'Reset password';
              const msg   = 'Password reset is coming soon. Contact Laurier ICT if you are locked out.';
              // Alert.alert is a no-op on react-native-web, so fall back there.
              if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
              else Alert.alert(title, msg);
            }}
          >
            <Text style={styles.link}>Forget password?</Text>
          </TouchableOpacity>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Create account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  scroll:      { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28 },

  headerLogo:  { fontSize: 16, fontWeight: '600', letterSpacing: 4, color: '#1a1a1a', marginTop: 16 },

  avatar:      { width: 130, height: 130, borderRadius: 65, backgroundColor: '#f0f0f3', alignItems: 'center', justifyContent: 'center', marginTop: 44, marginBottom: 36 },
  avatarEmoji: { fontSize: 56, opacity: 0.55 },

  form:        { width: '100%', maxWidth: 340, gap: 14 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldLabel:  { width: 86, fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  fieldInput:  { flex: 1, backgroundColor: '#f0f0f3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#1a1a1a', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },

  errorText:   { fontSize: 13, color: '#A32D2D', textAlign: 'center', marginTop: 2 },

  signInBtn:   { backgroundColor: BRAND.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  signInBtnDisabled: { opacity: 0.6 },
  signInText:  { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, color: '#fff' },

  link:        { fontSize: 13, color: BRAND.purpleDark, textAlign: 'center', textDecorationLine: 'underline', marginTop: 6 },
});
