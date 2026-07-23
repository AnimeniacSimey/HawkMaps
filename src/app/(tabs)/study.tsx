/**
 * HawkMaps · src/app/study.tsx
 *
 * Study space availability screen.
 * Dynamically fetches live data from FastAPI backend.
 */

import React, { useState, useEffect } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, STATUS_COLORS } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

type StudySpace = {
  id:       number;
  emoji?:   string;
  name:     string;
  building?:string;
  meta?:    string;
  seats?:   number;
  fill_pct: number;
  status:   'open' | 'busy' | 'full';
};

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  
  const [spaces, setSpaces] = useState<StudySpace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'search'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);

  // ── Fetch All Spaces ───────────────────────────────────────────────────
  const fetchAllSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_BASE) throw new Error('no backend configured');
      const res = await fetch(`${API_BASE}/api/spaces`);
      if (!res.ok) throw new Error(`bad response (${res.status})`);
      const data = await res.json();
      setSpaces(data);
      setActiveFilter('all');
      setShowSearchInput(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Error fetching all spaces:', err);
      setError("Couldn't load study spaces — check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Button 1: Filter Available Now ─────────────────────────────────────
  const handleAvailableNow = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_BASE) throw new Error('no backend configured');
      const res = await fetch(`${API_BASE}/api/spaces/available`);
      if (!res.ok) throw new Error(`bad response (${res.status})`);
      const data = await res.json();
      setSpaces(data);
      setActiveFilter('available');
      setShowSearchInput(false);
    } catch (err) {
      console.error('Error fetching available spaces:', err);
      setError("Couldn't load available spaces — check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Button 2: Find a Space (Search) ──────────────────────────────────
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setActiveFilter('search');
    setError(null);
    try {
      if (!API_BASE) throw new Error('no backend configured');
      const res = await fetch(`${API_BASE}/api/spaces/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`bad response (${res.status})`);
      const data = await res.json();
      setSpaces(data);
    } catch (err) {
      console.error('Error searching spaces:', err);
      setError("Couldn't search spaces — check your connection.");
    }
  };

  const toggleSearch = () => {
    setShowSearchInput(!showSearchInput);
    if (showSearchInput) {
      fetchAllSpaces();
    }
  };

  useEffect(() => {
    fetchAllSpaces();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Study Spaces</Text>
        <Text style={styles.heroSub}>Real-time availability across campus</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[
            styles.actionBtn, 
            activeFilter === 'available' && styles.actionBtnActive
          ]}
          onPress={handleAvailableNow}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <View>
            <Text style={styles.actionTitle}>Available Now</Text>
            <Text style={styles.actionMeta}>Filter open spaces</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionBtn, 
            activeFilter === 'search' && styles.actionBtnActive
          ]}
          onPress={toggleSearch}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <View>
            <Text style={styles.actionTitle}>Find a Space</Text>
            <Text style={styles.actionMeta}>Browse by building</Text>
          </View>
        </TouchableOpacity>
      </View>


      {/* Expandable Search Input */}
      {showSearchInput && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search spaces or buildings..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      )}

      {/* Header Label + Reset Button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>
          {activeFilter === 'available' ? 'AVAILABLE SPACES' : activeFilter === 'search' ? 'SEARCH RESULTS' : 'RIGHT NOW'}
        </Text>
        {activeFilter !== 'all' && (
          <TouchableOpacity onPress={fetchAllSpaces}>
            <Text style={styles.resetText}>Show All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAllSpaces} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND.dark} />
        </View>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: '#6b7280', marginTop: 20 }}>No study spaces found.</Text>
            </View>
          }
          renderItem={({ item }) => <SpaceRow space={item} />}
        />
      )}
    </View>
  );
}

function SpaceRow({ space }: { space: StudySpace }) {
  const statusKey = space.status || 'open';
  const colors = STATUS_COLORS[statusKey] || { bg: '#e5e7eb', text: '#374151', fill: '#9ca3af' };
  const label = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
  const fillPct = space.fill_pct ?? 0;
  const emoji = space.emoji || '📚';
  const metaText = space.meta || `${space.seats ? `${space.seats} seats · ` : ''}${space.building || 'Campus Space'}`;

  return (
    <View style={styles.spaceRow}>
      <View style={styles.spaceIcon}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={styles.spaceMeta}>
        <Text style={styles.spaceName}>{space.name}</Text>
        <Text style={styles.spaceSubMeta}>{metaText}</Text>
        {/* Availability bar */}
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${fillPct}%` as any, backgroundColor: colors.fill }]} />
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
  actionBtnActive: { backgroundColor: '#e2e8f0', borderColor: BRAND.dark },
  actionIcon:   { fontSize: 22 },
  actionTitle:  { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  actionMeta:   { fontSize: 11, color: '#6b7280', marginTop: 2 },

  searchContainer: { paddingHorizontal: 16, paddingTop: 10 },
  searchInput: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8 },
  resetText: { fontSize: 11, fontWeight: '700', color: BRAND.dark },

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
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:   { fontSize: 13, color: '#A32D2D', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:    { marginTop: 12, backgroundColor: BRAND.dark2, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  retryBtnText:{ fontSize: 13, fontWeight: '700', color: '#fff' },
  debugText:   { fontSize: 11, color: '#fff', backgroundColor: '#A32D2D', textAlign: 'center', paddingVertical: 4 },
});