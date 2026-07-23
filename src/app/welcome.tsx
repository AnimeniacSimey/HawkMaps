/**
 * HawkMaps · src/app/welcome.tsx
 *
 * Landing screen (first thing a signed-out user sees):
 * logo → HAWK MAPS wordmark → arrow button into the sign-in screen.
 */

import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Header wordmark */}
      <Text style={styles.headerLogo}>L O G O</Text>

      {/* Centre: logo tile + app name */}
      <View style={styles.centre}>
        <View style={styles.logoTile}>
          <Text style={styles.logoEmoji}>🦅</Text>
        </View>
        <Text style={styles.appName}>H A W K   M A P S</Text>
      </View>

      {/* Arrow → sign in */}
      <TouchableOpacity
        style={styles.arrowBtn}
        onPress={() => router.push('/login')}
        accessibilityLabel="Continue to sign in"
      >
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 32 },

  headerLogo:  { fontSize: 16, fontWeight: '600', letterSpacing: 4, color: '#1a1a1a', marginTop: 28 },

  centre:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  logoTile:    { width: 140, height: 140, borderRadius: 24, backgroundColor: BRAND.purpleLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  logoEmoji:   { fontSize: 64 },
  appName:     { fontSize: 15, fontWeight: '600', letterSpacing: 3, color: '#1a1a1a' },

  arrowBtn:    { width: 150, height: 46, borderRadius: 10, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  arrowText:   { fontSize: 22, color: '#fff', fontWeight: '600' },
});
