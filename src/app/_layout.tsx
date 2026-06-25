/**
 * HawkMaps · src/app/_layout.tsx
 *
 * Root tab navigator (Expo Router file-based routing).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW TAB
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Create  src/app/your-screen.tsx  (export a default React component).
 * 2. Add a <Tabs.Screen> entry in the <Tabs> navigator below.
 *    Copy any existing entry and change name / title / tabBarIcon.
 * 3. Done — Expo Router picks up the new file automatically.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND } from '@/constants/theme';

// Simple emoji icon helper so we don't need image assets for every tab.
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function AppLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown:        false,
          tabBarActiveTintColor:   BRAND.purple,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth:   0.5,
            borderTopColor:   'rgba(0,0,0,0.12)',
            // Extra bottom padding on Android for gesture bar
            paddingBottom:    Platform.OS === 'android' ? 8 : 0,
            height:           Platform.OS === 'android' ? 64 : 49,
          },
          tabBarLabelStyle: {
            fontSize:   10,
            fontWeight: '600',
            marginTop:  -2,
          },
        }}
      >
        {/* ── MAP (home tab) ───────────────────────────────────────────── */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📍" focused={focused} />,
          }}
        />

        {/* ── EVENTS ──────────────────────────────────────────────────── */}
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
          }}
        />

        {/* ── STUDY SPACES ────────────────────────────────────────────── */}
        <Tabs.Screen
          name="study"
          options={{
            title: 'Study',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
          }}
        />

        {/* ── GOLDENHAWK AI ────────────────────────────────────────────── */}
        <Tabs.Screen
          name="ai"
          options={{
            title: 'GoldenHawk',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🐥" focused={focused} />,
          }}
        />

        {/*
         * ── ADD YOUR TAB HERE ─────────────────────────────────────────
         * <Tabs.Screen
         *   name="your-screen"
         *   options={{
         *     title: 'Label',
         *     tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} />,
         *   }}
         * />
         */}
      </Tabs>
    </SafeAreaProvider>
  );
}
