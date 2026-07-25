/**
 * HawkMaps · src/app/ai.tsx
 *
 * GoldenHawk AI assistant screen.
 * Sends messages to the Python backend at POST /api/ai/chat.
 * Falls back to rule-based demo responses if the backend is unreachable.
 *
 * UX niceties:
 *   • Tappable starter prompts to get students going.
 *   • Word-by-word "typewriter" reveal so replies feel live.
 *   • An honest "offline" badge when a reply came from the local fallback
 *     instead of the real AI — plus a Retry action to try the live model.
 *
 * To point at a real server, set EXPO_PUBLIC_API_BASE (see below).
 */

import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
import { answerLocally, resolveLocation, type ChatContext } from '@/lib/goldenhawkLocal';
import { DEFAULT_API_BASE } from '@/config';

// ── API config ─────────────────────────────────────────────────────────
// Points at the Python backend that runs GoldenHawk AI. Resolution order:
//   1. EXPO_PUBLIC_API_BASE from a local `.env` (your own machine while dev'ing)
//      e.g. EXPO_PUBLIC_API_BASE=http://192.168.1.42:8000  (LAN IP, not localhost)
//   2. DEFAULT_API_BASE from src/config.ts (the deployed backend, shared by the team)
// If both are empty the chat runs fully offline on the on-device engine.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_API_BASE;

// Only send the last few turns as context — keeps requests small and cheap.
const HISTORY_TURNS = 8;

// Starter prompts shown before the student has asked anything.
const STARTERS = [
  'Fastest indoor route to BA 202',
  'Is the library open right now?',
  'Where can I study quietly?',
  'Any goose sightings today?',
  "What's happening on campus this week?",
];

// ── Types ───────────────────────────────────────────────────────────────
// 'ai'       — a real GoldenHawk AI (Claude / Groq) reply
// 'fallback' — backend was reached but answered with keyword rules (no AI key)
// 'offline'  — the app couldn't reach the backend at all; local demo reply
type Source = 'ai' | 'fallback' | 'offline';
type Message = {
  id: number;
  role: 'user' | 'bot';
  text: string;
  source?: Source;
  replyTo?: string;   // the user message this bot reply answered (for Retry)
  animate?: boolean;  // typewriter-reveal this bubble on mount
};

// Ask the backend (or answer locally). Never throws — always resolves.
// When the backend is unreachable, the on-device engine (answerLocally) still
// produces a real, campus-data-grounded reply.
async function requestReply(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  ctx?: ChatContext,
): Promise<{ text: string; source: Source }> {
  if (!API_BASE) return { text: answerLocally(message, ctx), source: 'offline' };
  try {
    // 60s cap: rides a free-tier cold start, but won't hang forever if the
    // backend is truly down (then it falls back to the on-device engine).
    const ctrl = new AbortController();
    const abort = setTimeout(() => ctrl.abort(), 60000);
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, history }),
      signal:  ctrl.signal,
    });
    clearTimeout(abort);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as { reply?: string; source?: string };
    // Real AI reply → use it. If the backend fell back to keyword rules (no AI
    // key), our on-device engine is grounded in real campus data, so prefer it.
    if (data.source === 'goldenhawk-ai') {
      return { text: (data.reply ?? '').trim() || answerLocally(message, ctx), source: 'ai' };
    }
    return { text: answerLocally(message, ctx), source: 'fallback' };
  } catch {
    return { text: answerLocally(message, ctx), source: 'offline' };
  }
}

// ── Component ────────────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: 0,
    role: 'bot',
    text: "Hey! I'm GoldenHawk 🐥 — your Laurier campus assistant. Ask me about routes, building hours, study spaces, events, or goose hotspots!",
  },
];

export default function AIScreen() {
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<'checking' | 'live' | 'offline' | 'waking'>(
    API_BASE ? 'checking' : 'offline',
  );
  // Lets the tappable header trigger an immediate wake/re-check (see effect below).
  const wakeRef = useRef<(() => void) | null>(null);
  // Last place mentioned, so "how do I get there" resolves instead of looping.
  const lastPlaceRef = useRef<string | undefined>(undefined);

  // Poll the backend so the header reflects Live vs Offline and self-heals.
  // The timeout is generous (60s) so a hosted free-tier COLD START — which can
  // take ~50s to wake — stays "Connecting…" instead of falsely showing Offline.
  // Polls are chained (next one 15s after the previous settles) so a slow wake
  // doesn't stack overlapping requests.
  useEffect(() => {
    if (!API_BASE) return;
    let alive = true;
    let fails = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const ctrl = new AbortController();
        const abort = setTimeout(() => ctrl.abort(), 60000); // ride through cold starts
        const res = await fetch(`${API_BASE}/api/health`, { signal: ctrl.signal });
        clearTimeout(abort);
        if (!res.ok) throw new Error(`health ${res.status}`);
        const data = (await res.json()) as { goldenhawk_ai?: string };
        if (!alive) return;
        fails = 0;
        setStatus(data.goldenhawk_ai === 'connected' ? 'live' : 'offline');
      } catch {
        if (!alive) return;
        fails += 1;
        if (fails >= 2) setStatus('offline'); // tolerate one blip / mid-wake abort
      } finally {
        if (alive) timer = setTimeout(check, 15000);
      }
    };

    check();

    // Manual wake: any user can tap the header to nudge the (possibly asleep)
    // server. Cancels the scheduled poll, shows "Waking…", and re-checks now.
    wakeRef.current = () => {
      if (!alive) return;
      if (timer) clearTimeout(timer);
      fails = 0;
      setStatus('waking');
      check();
    };

    return () => { alive = false; if (timer) clearTimeout(timer); wakeRef.current = null; };
  }, []);

  const scrollToEnd = () => listRef.current?.scrollToEnd({ animated: true });

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) setTimeout(scrollToEnd, 100);
  }, [messages]);

  const toHistory = (msgs: Message[]) =>
    msgs
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: (m.role === 'bot' ? 'assistant' : 'user') as 'assistant' | 'user', content: m.text }));

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    const history = toHistory(messages);
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text }]);
    setInput('');
    setLoading(true);

    const reply = await requestReply(text, history, { lastPlace: lastPlaceRef.current });
    const named = resolveLocation(text)?.building.name;
    if (named) lastPlaceRef.current = named;
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, role: 'bot', ...reply, replyTo: text, animate: true },
    ]);
    setLoading(false);
  };

  // Re-run the live model for a bot reply that came back offline/fallback.
  const retry = async (botId: number, userText: string) => {
    if (loading) return;
    const remaining = messages.filter((m) => m.id !== botId);
    setMessages(remaining);
    setLoading(true);

    const reply = await requestReply(userText, toHistory(remaining), { lastPlace: lastPlaceRef.current });
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, role: 'bot', ...reply, replyTo: userText, animate: true },
    ]);
    setLoading(false);
  };

  const showStarters = messages.length <= 1 && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.duck}>🐥</Text>
        <View>
          <Text style={styles.headerTitle}>GoldenHawk AI</Text>
          <TouchableOpacity
            style={styles.statusRow}
            activeOpacity={0.6}
            onPress={() => wakeRef.current?.()}
            disabled={!API_BASE || status === 'live' || status === 'waking'}
          >
            <View
              style={[
                styles.statusDot,
                status === 'live'
                  ? styles.statusDotLive
                  : status === 'offline'
                    ? styles.statusDotOffline
                    : styles.statusDotChecking, // checking + waking
              ]}
            />
            <Text style={styles.headerSub}>
              {status === 'live'
                ? 'Live AI connected'
                : status === 'waking'
                  ? 'Waking server… (~30s)'
                  : status === 'checking'
                    ? 'Connecting…'
                    : API_BASE
                      ? 'Offline — tap to wake up'
                      : 'Offline mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
        renderItem={({ item }) => (
          <MessageBubble message={item} onReveal={scrollToEnd} onRetry={retry} />
        )}
        ListFooterComponent={loading ? <TypingIndicator /> : null}
      />

      {/* Starter prompts (only before the first question) */}
      {showStarters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          {STARTERS.map((s) => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => handleSend(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask GoldenHawk…"
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend(input)}
          returnKeyType="send"
          editable={!loading}
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend(input)}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  onReveal,
  onRetry,
}: {
  message: Message;
  onReveal: () => void;
  onRetry: (botId: number, userText: string) => void;
}) {
  const isBot = message.role === 'bot';
  const shouldAnimate = isBot && !!message.animate;

  // Typewriter reveal: show the text token-by-token on first mount.
  const [shown, setShown] = useState(shouldAnimate ? '' : message.text);
  useEffect(() => {
    if (!shouldAnimate) return;
    const tokens = message.text.split(/(\s+)/); // keep whitespace so newlines survive
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(tokens.slice(0, i).join(''));
      onReveal();
      if (i >= tokens.length) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const degraded = isBot && (message.source === 'offline' || message.source === 'fallback');

  return (
    <View style={styles.msgBlock}>
      <View style={[styles.msgRow, !isBot && styles.msgRowUser]}>
        {isBot && <Text style={styles.msgAvatar}>🐥</Text>}
        <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
          <Text style={[styles.bubbleText, !isBot && styles.bubbleTextUser]}>{shown}</Text>
        </View>
      </View>

      {/* Honesty badge + Retry for non-AI replies */}
      {degraded && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {message.source === 'offline' ? '⚡ Offline — demo reply' : '⚡ Offline mode (no live AI)'}
          </Text>
          {API_BASE && message.replyTo ? (
            <TouchableOpacity
              style={styles.retryPill}
              onPress={() => onRetry(message.id, message.replyTo as string)}
            >
              <Text style={styles.retryText}>↻ Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.msgRow}>
      <Text style={styles.msgAvatar}>🐥</Text>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <Text style={styles.typingDots}>• • •</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },

  header:       { backgroundColor: BRAND.dark, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  duck:         { fontSize: 30 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusDotLive:     { backgroundColor: '#4ADE80' },
  statusDotChecking: { backgroundColor: '#FACC15' },
  statusDotOffline:  { backgroundColor: '#9ca3af' },

  messageList:  { paddingHorizontal: 12, paddingTop: 12, gap: 12 },

  msgBlock:      { gap: 4 },
  msgRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser:    { flexDirection: 'row-reverse' },
  msgAvatar:     { fontSize: 22 },
  bubble:        { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10 },
  bubbleBot:     { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  bubbleUser:    { backgroundColor: BRAND.purple, borderBottomRightRadius: 4 },
  bubbleText:    { fontSize: 14, color: '#1a1a1a', lineHeight: 20 },
  bubbleTextUser:{ color: '#fff' },
  typingBubble:  { paddingVertical: 14 },
  typingDots:    { fontSize: 16, color: '#9ca3af', letterSpacing: 4 },

  // Honesty badge + retry row (under a bot bubble)
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 30 },
  metaText:      { fontSize: 11, color: '#9ca3af' },
  retryPill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: BRAND.purpleLight },
  retryText:     { fontSize: 11, fontWeight: '600', color: BRAND.purpleDark },

  // Starter prompt chips
  chipsRow:      { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chip:          { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: BRAND.purpleLight, borderWidth: 0.5, borderColor: 'rgba(123,47,190,0.25)' },
  chipText:      { fontSize: 13, color: BRAND.purpleDark, fontWeight: '500' },

  inputRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.1)' },
  input:        { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  sendBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText:  { fontSize: 16, color: '#fff' },
});
