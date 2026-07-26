/**
 * HawkMaps · src/app/(tabs)/events.tsx
 *
 * Club event discovery screen.
 *
 * Account designations (see src/hooks/use-auth.tsx):
 *   • Regular students browse/search events and can apply to become a club
 *     exec via the Google Form linked top-left (link TBD — see
 *     CLUB_EXEC_FORM_URL below).
 *   • Club executives get everything students get PLUS a "+ Create" button
 *     that posts an event for their own club (the backend enforces the club).
 *
 * Events load from GET /api/events and fall back to the local demo list
 * when no backend is configured.
 */

import { API_BASE } from '@/constants/api';
import { BRAND } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { validateEventInput } from '@/utils/moderation';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Club exec application form ──────────────────────────────────────────
// Students apply here to become a club executive; exec status is then
// granted manually on their account (see backend/main.py USERS_DB).
const CLUB_EXEC_FORM_URL = 'https://forms.gle/gsEhmKNq9cs1ie9X6';

// ── Data ────────────────────────────────────────────────────────────────
type Event = {
  id:          number;
  emoji:       string;
  title:       string;
  date:        string;      // display string, e.g. "Nov 8"
  location:    string;
  tags:        string[];
  bg:          string;
  club?:       string | null;
  description?: string;
  startIso?:   string;      // e.g. "2026-11-08T14:00" (when known)
  endIso?:     string;
};

const DEMO_EVENTS: Event[] = [
  { id:1, emoji:'💻', title:'CS Club Hackathon',   date:'Nov 8',  location:'BA 202',          tags:['Tech','Free'],    bg:'#2d1b69', club:'CS Club' },
  { id:2, emoji:'🎵', title:'Open Mic Night',       date:'Nov 9',  location:'Turret Lounge',   tags:['Social','Free'],  bg:'#78440a', club:'Music Club' },
  { id:3, emoji:'🌿', title:'Eco Club Fair',         date:'Nov 10', location:'Concourse',       tags:['Environment'],    bg:'#085041', club:'Eco Club' },
  { id:4, emoji:'🏆', title:'Intramural Finals',     date:'Nov 11', location:'AC Gym',          tags:['Sports'],         bg:'#0c447c', club:'Athletics' },
  { id:5, emoji:'👔', title:'Career Fair 2026',      date:'Nov 15', location:'Athletic Complex',tags:['Career','Free'],  bg:'#1a1a2e' },
  { id:6, emoji:'🎨', title:'Art & Design Expo',     date:'Nov 20', location:'SC Building',     tags:['Arts'],           bg:'#3d0d6b', club:'Art Collective' },
];

// Look & feel for events that come from the API (no emoji/colour stored).
const TAG_EMOJI: Record<string, string> = {
  Tech:'💻', Social:'🎵', Environment:'🌿', Sports:'🏆',
  Career:'👔', Arts:'🎨', Club:'🎪', Free:'🎉',
};
const CARD_COLORS = ['#2d1b69', '#78440a', '#085041', '#0c447c', '#1a1a2e', '#3d0d6b'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** "2026-11-08T09:00" → "Nov 8" (falls back to the raw string). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "2026-11-08T14:00" → "2:00 PM" (empty string if unparseable). */
function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

function apiToEvent(e: any): Event {
  const tags: string[] = e.tags ?? [];
  return {
    id:          e.id,
    emoji:       TAG_EMOJI[tags[0]] ?? '🎉',
    title:       e.title,
    date:        formatDate(e.start ?? ''),
    location:    e.location,
    tags,
    bg:          CARD_COLORS[e.id % CARD_COLORS.length],
    club:        e.club,
    description: e.description,
    startIso:    e.start,
    endIso:      e.end,
  };
}

// ── Component ────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [query,  setQuery]  = useState('');
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [selected,   setSelected]   = useState<Event | null>(null);

  const isExec = session?.role === 'club_exec';

  const loadEvents = useCallback(async () => {
    if (!API_BASE) return; // demo mode — keep the local list
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setEvents(data.map(apiToEvent));
    } catch {
      // Backend unreachable — keep whatever we have (demo list).
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.location.toLowerCase().includes(query.toLowerCase())
  );

  const openExecForm = () => {
    if (!CLUB_EXEC_FORM_URL) {
      const title = 'Become a club exec';
      const msg   = 'The application form link is coming soon — check back shortly!';
      // Alert.alert is a no-op on react-native-web, so fall back there.
      if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
      else Alert.alert(title, msg);
      return;
    }
    Linking.openURL(CLUB_EXEC_FORM_URL);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header — exec application link top-left, create button for execs */}
      <View style={styles.headerTopRow}>
        <TouchableOpacity style={styles.execFormBtn} onPress={openExecForm}>
          <Text style={styles.execFormText}>📝 Become a club exec</Text>
        </TouchableOpacity>
        {isExec && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>
          {filtered.length} upcoming{isExec && session?.club ? `  ·  ${session.club} exec` : ''}
        </Text>
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
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => setSelected(item)} />
        )}
      />

      {/* Event details — opens when a card is tapped */}
      <EventDetailsModal event={selected} onClose={() => setSelected(null)} />

      {/* Exec-only: create an event for their club */}
      {isExec && (
        <CreateEventModal
          visible={showCreate}
          club={session?.club ?? ''}
          token={session?.token ?? ''}
          onClose={() => setShowCreate(false)}
          onCreated={(ev) => {
            setShowCreate(false);
            if (API_BASE) loadEvents();
            else setEvents((prev) => [...prev, ev]); // demo mode
          }}
        />
      )}
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

  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatDate(start)}/${formatDate(end)}` +
    `&location=${encodeURIComponent(event.location)}`;

  Linking.openURL(url);
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.cardBanner, { backgroundColor: event.bg }]}>
        <Text style={styles.cardEmoji}>{event.emoji}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardMeta}>
          📅 {event.date} · 📍 {event.location}{event.club ? ` · ${event.club}` : ''}
        </Text>
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
    </TouchableOpacity>
  );
}

// ── Event details modal (opens when a card is tapped) ────────────────────
function EventDetailsModal({ event, onClose }: { event: Event | null; onClose: () => void }) {
  if (!event) return null;

  const startTime = formatTime(event.startIso);
  const endTime   = formatTime(event.endIso);
  const timeRange = startTime ? (endTime ? `${startTime} – ${endTime}` : startTime) : '';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.detailSheet} onPress={() => {}}>
          {/* Banner */}
          <View style={[styles.detailBanner, { backgroundColor: event.bg }]}>
            <Text style={styles.detailEmoji}>{event.emoji}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.detailBody}>
            <Text style={styles.detailTitle}>{event.title}</Text>
            {!!event.club && <Text style={styles.detailClub}>Hosted by {event.club}</Text>}

            <View style={styles.detailInfoBlock}>
              <Text style={styles.detailInfoRow}>📅  {event.date}{timeRange ? `  ·  ${timeRange}` : ''}</Text>
              <Text style={styles.detailInfoRow}>📍  {event.location}</Text>
            </View>

            {event.tags.length > 0 && (
              <View style={styles.tagRow}>
                {event.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.detailDescription}>
              {event.description?.trim() ||
                'No description yet — check with the club for details.'}
            </Text>

            <TouchableOpacity style={styles.detailCalendarBtn} onPress={() => addToGoogleCalendar(event)}>
              <Text style={styles.detailCalendarText}>+ Add to Google Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Create-event modal (club execs only) ─────────────────────────────────
function CreateEventModal({
  visible,
  club,
  token,
  onClose,
  onCreated,
}: {
  visible:   boolean;
  club:      string;
  token:     string;
  onClose:   () => void;
  onCreated: (ev: Event) => void;
}) {
  const [title,    setTitle]    = useState('');
  const [location, setLocation] = useState('');
  const [date,     setDate]     = useState('');   // YYYY-MM-DD
  const [start,    setStart]    = useState('');   // HH:MM
  const [end,      setEnd]      = useState('');   // HH:MM
  const [desc,     setDesc]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const reset = () => {
    setTitle(''); setLocation(''); setDate('');
    setStart(''); setEnd(''); setDesc(''); setError('');
  };

  const submit = async () => {
    if (loading) return;
    setError('');
    if (!title.trim() || !location.trim() || !date.trim()) {
      setError('Title, location, and date are required.');
      return;
    }
    // Length limits + profanity/appropriateness check (mirrored on the backend).
    const invalid = validateEventInput({ title, location, description: desc });
    if (invalid) {
      setError(invalid);
      return;
    }
    const startIso = `${date.trim()}T${start.trim() || '12:00'}`;
    const endIso   = `${date.trim()}T${end.trim()   || '13:00'}`;
    if (isNaN(new Date(startIso).getTime()) || isNaN(new Date(endIso).getTime())) {
      setError('Date must look like 2026-11-08 (and times like 14:30).');
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setError('The event must end after it starts.');
      return;
    }
    setLoading(true);
    try {
      if (!API_BASE) {
        // Demo mode — add locally so the flow is testable offline.
        onCreated({
          id:          Date.now(),
          emoji:       '🎪',
          title:       title.trim(),
          date:        formatDate(startIso),
          location:    location.trim(),
          tags:        ['Club'],
          bg:          CARD_COLORS[Date.now() % CARD_COLORS.length],
          club,
          description: desc.trim(),
          startIso,
          endIso,
        });
        reset();
        return;
      }
      const res = await fetch(`${API_BASE}/api/events`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title:       title.trim(),
          description: desc.trim(),
          location:    location.trim(),
          start_time:  startIso,
          end_time:    endIso,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail ?? 'Could not create the event — try again.');
      onCreated(apiToEvent(data));
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the event — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Create event</Text>
            <Text style={styles.modalSub}>Posting as {club} — events are always for your own club.</Text>

            <TextInput style={styles.modalInput} placeholder="Event title *"          placeholderTextColor="#9ca3af" value={title}    onChangeText={setTitle} />
            <TextInput style={styles.modalInput} placeholder="Location * (e.g. BA 202)" placeholderTextColor="#9ca3af" value={location} onChangeText={setLocation} />
            <TextInput style={styles.modalInput} placeholder="Date * (2026-11-08)"     placeholderTextColor="#9ca3af" value={date}     onChangeText={setDate} autoCapitalize="none" />
            <View style={styles.modalTimeRow}>
              <TextInput style={[styles.modalInput, styles.modalTimeInput]} placeholder="Start (14:00)" placeholderTextColor="#9ca3af" value={start} onChangeText={setStart} autoCapitalize="none" />
              <TextInput style={[styles.modalInput, styles.modalTimeInput]} placeholder="End (16:00)"   placeholderTextColor="#9ca3af" value={end}   onChangeText={setEnd}   autoCapitalize="none" />
            </View>
            <TextInput
              style={[styles.modalInput, styles.modalDescInput]}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              value={desc}
              onChangeText={setDesc}
              multiline
            />

            {!!error && <Text style={styles.modalError}>{error}</Text>}

            <TouchableOpacity
              style={[styles.modalSubmit, loading && { opacity: 0.6 }]}
              onPress={submit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSubmitText}>POST EVENT</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },

  headerTopRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  execFormBtn: { backgroundColor: BRAND.purpleLight, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  execFormText:{ fontSize: 11, fontWeight: '600', color: BRAND.purpleDark },
  createBtn:   { backgroundColor: BRAND.purple, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  createBtnText:{ fontSize: 11, fontWeight: '700', color: '#fff' },

  header:      { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
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

  detailSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', maxHeight: '85%' },
  detailBanner:      { height: 110, alignItems: 'center', justifyContent: 'center' },
  detailEmoji:       { fontSize: 52 },
  detailBody:        { padding: 20, gap: 12 },
  detailTitle:       { fontSize: 20, fontWeight: '800', color: BRAND.dark },
  detailClub:        { fontSize: 13, fontWeight: '600', color: BRAND.purpleDark, marginTop: -6 },
  detailInfoBlock:   { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, gap: 6 },
  detailInfoRow:     { fontSize: 13, color: '#1a1a1a' },
  detailDescription: { fontSize: 14, color: '#374151', lineHeight: 21 },
  detailCalendarBtn: { backgroundColor: BRAND.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  detailCalendarText:{ fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: '#fff' },

  modalBackdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: BRAND.dark },
  modalSub:       { fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 14 },
  modalInput:     { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', marginBottom: 10 },
  modalTimeRow:   { flexDirection: 'row', gap: 10 },
  modalTimeInput: { flex: 1 },
  modalDescInput: { minHeight: 64, textAlignVertical: 'top' },
  modalError:     { fontSize: 13, color: '#A32D2D', textAlign: 'center', marginBottom: 8 },
  modalSubmit:    { backgroundColor: BRAND.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalSubmitText:{ fontSize: 14, fontWeight: '700', letterSpacing: 1.5, color: '#fff' },
  modalCancel:    { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 12, marginBottom: 4 },
});
