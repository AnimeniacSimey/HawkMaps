/**
 * HawkMaps · src/app/_layout.tsx
 *
 * Root layout — wraps the app in AuthProvider and gates routes:
 *
 *   signed OUT →  welcome → login / signup
 *   signed IN  →  (tabs)  — Map · Events · Study · GoldenHawk
 *
 * Uses Expo Router's Stack.Protected guards (SDK 53+): when `session`
 * changes, the router automatically switches between the two groups —
 * no manual redirects needed. Signing in lands on (tabs)/index (the Map).
 */

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

function RootNavigator() {
  const { session } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ── Signed in: the main tab app ─────────────────────────────── */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      {/* ── Signed out: welcome → login / signup ────────────────────── */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
