/**
 * HawkMaps · src/app/signup.tsx
 *
 * Create-account screen. Requires a Laurier email (@mylaurier.ca / @wlu.ca)
 * and a password of 6+ characters. On success the user is signed in right
 * away and the auth guard in src/app/_layout.tsx switches to the (tabs) app.
 */

import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
      // Success — the root layout's auth guard swaps to (tabs) automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed — try again.');
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

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Use your Laurier email to join HawkMaps</Text>

        {/* Fields */}
        <View style={styles.form}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name:</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Golden Hawk"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email:</Text>
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
              placeholder="6+ characters"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Confirm:</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Repeat password"
              placeholderTextColor="#9ca3af"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              editable={!loading}
              onSubmitEditing={handleSignUp}
              returnKeyType="go"
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.signUpText}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>

          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Already have an account? Sign in</Text>
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

  avatar:      { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f3', alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 20 },
  avatarEmoji: { fontSize: 44, opacity: 0.55 },

  title:       { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  subtitle:    { fontSize: 13, color: '#60646C', marginTop: 4, marginBottom: 24 },

  form:        { width: '100%', maxWidth: 340, gap: 14 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldLabel:  { width: 86, fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  fieldInput:  { flex: 1, backgroundColor: '#f0f0f3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#1a1a1a', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },

  errorText:   { fontSize: 13, color: '#A32D2D', textAlign: 'center', marginTop: 2 },

  signUpBtn:   { backgroundColor: BRAND.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  signUpBtnDisabled: { opacity: 0.6 },
  signUpText:  { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, color: '#fff' },

  link:        { fontSize: 13, color: BRAND.purpleDark, textAlign: 'center', textDecorationLine: 'underline', marginTop: 6 },
});
