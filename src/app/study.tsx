/**
 * HawkMaps · src/app/study.tsx
 *
 * Study space availability screen.
 * Fill percentages would come from a real API in production.
 */

import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, STATUS_COLORS } from '@/constants/theme';

type StudySpace = {
  id:     number;
  emoji:  string;
  name:   string;
  meta:   string;
  fill:   number;   // 0–100 %
  status: 'open' | 'busy' | 'full';
};

const SPACES: StudySpace[] = [
  { id:1, emoji:'📚', name:"Peters Library — 2nd Floor",   meta:"36 seats · Quiet zone",     fill:40, status:'open' },
  { id:2, emoji:'🏫', name:"BA Building — Study Room 3",   meta:"8 seats · Collaborative",   fill:72, status:'busy' },
  { id:3, emoji:'☕', name:"Byte Café Seating Area",        meta:"24 seats · Casual",         fill:95, status:'full' },
  { id:4, emoji:'📖', name:"Lazaridis Hall — Atrium",      meta:"50 seats · Open concept",   fill:25, status:'open' },
  { id:5, emoji:'🖥️', name:"Science Building — Lab Wing",  meta:"20 seats · Computer lab",  fill:60, status:'busy' },
];

export default function StudyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Study Spaces</Text>
        <Text style={styles.heroSub}>Real-time availability across campus</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📅</Text>
          <View>
            <Text style={styles.actionTitle}>Available Now</Text>
            <Text style={styles.actionMeta}>Filter open spaces</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🔍</Text>
          <View>
            <Text style={styles.actionTitle}>Find a Space</Text>
            <Text style={styles.actionMeta}>Browse by building</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>RIGHT NOW</Text>

      <FlatList
        data={SPACES}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => <SpaceRow space={item} />}
      />
    </View>
  );
}

function SpaceRow({ space }: { space: StudySpace }) {
  const colors = STATUS_COLORS[space.status];
  const label  = space.status.charAt(0).toUpperCase() + space.status.slice(1);

  return (
    <View style={styles.spaceRow}>
      <View style={styles.spaceIcon}>
        <Text style={{ fontSize: 18 }}>{space.emoji}</Text>
      </View>
      <View style={styles.spaceMeta}>
        <Text style={styles.spaceName}>{space.name}</Text>
        <Text style={styles.spaceSubMeta}>{space.meta}</Text>
        {/* Availability bar */}
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${space.fill}%` as any, backgroundColor: colors.fill }]} />
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  hero:       { backgroundColor: BRAND.dark, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  heroTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub:    { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  actionRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f5f5f5', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  actionIcon:   { fontSize: 22 },
  actionTitle:  { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  actionMeta:   { fontSize: 11, color: '#6b7280', marginTop: 2 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },

  spaceRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  spaceIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: BRAND.purpleLight, alignItems: 'center', justifyContent: 'center' },
  spaceMeta:   { flex: 1 },
  spaceName:   { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  spaceSubMeta:{ fontSize: 11, color: '#6b7280', marginTop: 1 },
  bar:         { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  barFill:     { height: 4, borderRadius: 2 },
  badge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  divider:     { height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' },
});
