/**
 * HawkMaps · src/app/events.tsx
 *
 * Club event discovery screen.
 * To add events, edit the EVENTS array below (or swap in an API call).
 */

import { BRAND } from '@/constants/theme';
import { useState } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Data ────────────────────────────────────────────────────────────────
type Event = {
  id:       number;
  emoji:    string;
  title:    string;
  date:     string;
  location: string;
  tags:     string[];
  bg:       string;
};

const EVENTS: Event[] = [
  { id:1, emoji:'💻', title:'CS Club Hackathon',   date:'Nov 8',  location:'BA 202',          tags:['Tech','Free'],    bg:'#2d1b69' },
  { id:2, emoji:'🎵', title:'Open Mic Night',       date:'Nov 9',  location:'Turret Lounge',   tags:['Social','Free'],  bg:'#78440a' },
  { id:3, emoji:'🌿', title:'Eco Club Fair',         date:'Nov 10', location:'Concourse',       tags:['Environment'],    bg:'#085041' },
  { id:4, emoji:'🏆', title:'Intramural Finals',     date:'Nov 11', location:'AC Gym',          tags:['Sports'],         bg:'#0c447c' },
  { id:5, emoji:'👔', title:'Career Fair 2026',      date:'Nov 15', location:'Athletic Complex',tags:['Career','Free'],  bg:'#1a1a2e' },
  { id:6, emoji:'🎨', title:'Art & Design Expo',     date:'Nov 20', location:'SC Building',     tags:['Arts'],           bg:'#3d0d6b' },
];

// ── Component ────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = EVENTS.filter((e) =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>{filtered.length} upcoming</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events or locations…"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No events match "{query}"</Text>
        }
        renderItem={({ item }) => <EventCard event={item} />}
      />
    </View>
  );
}
function addToGoogleCalendar(event: Event) {
  const year = new Date().getFullYear();

  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const [monthName, day] = event.date.split(" ");

  const start = new Date(
    year,
    months[monthName],
    parseInt(day),
    12,
    0,
    0
  );

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  console.log(start);
console.log(start.getTime());
  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatDate(start)}/${formatDate(end)}` +
    `&location=${encodeURIComponent(event.location)}`;

  Linking.openURL(url);
}
function EventCard({ event }: { event: Event }) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardBanner, { backgroundColor: event.bg }]}>
        <Text style={styles.cardEmoji}>{event.emoji}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardMeta}>📅 {event.date} · 📍 {event.location}</Text>
        <View style={styles.tagRow}>
          {event.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity
      style={styles.addBtn}
      onPress={() => addToGoogleCalendar(event)}
      >
        <Text style={styles.addBtnText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  header:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title:       { fontSize: 22, fontWeight: '800', color: BRAND.dark },
  subtitle:    { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  searchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  clearBtn:    { fontSize: 14, color: '#9ca3af' },

  list:        { paddingHorizontal: 16, paddingTop: 4 },
  empty:       { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },

  card:        { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  cardBanner:  { width: 64, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  cardEmoji:   { fontSize: 26 },
  cardBody:    { flex: 1, padding: 12, gap: 4 },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  cardMeta:    { fontSize: 11, color: '#6b7280' },
  tagRow:      { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag:         { backgroundColor: BRAND.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:     { fontSize: 10, fontWeight: '600', color: BRAND.purpleDark },

  addBtn:      { backgroundColor: BRAND.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginRight: 12 },
  addBtnText:  { fontSize: 11, fontWeight: '700', color: '#fff' },
});
