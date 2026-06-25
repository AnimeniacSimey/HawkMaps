/**
 * HawkMaps · src/app/ai.tsx
 *
 * GoldenHawk AI assistant screen.
 * Sends messages to the Python backend at POST /api/ai/chat.
 * Falls back to rule-based demo responses if the backend is unreachable.
 *
 * To point at a real server, change API_BASE below.
 */

import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND } from '@/constants/theme';

// ── API config ─────────────────────────────────────────────────────────
// Replace with your deployed Python backend URL.
// In development: 'http://YOUR_LOCAL_IP:8000'  (NOT localhost — device needs LAN IP)
const API_BASE = '';   // e.g. 'http://192.168.1.42:8000'

// ── Demo fallback responses (used when API_BASE is empty / unreachable) ─
const DEMO_RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['route', 'how do i get', 'direction', 'navigate', 'way to', 'hall', 'building'],
    reply: 'From the main concourse, take the indoor tunnel through Peters Library, then follow the underground path to BA Building. Room 202 is on the east side of floor 2 — about 4 minutes walk 🗺️',
  },
  {
    keywords: ['goose', 'geese'],
    reply: '⚠️ 3 goose sightings near Alumni Hall today. I\'d recommend using the Seagram Dr side entrance instead. Stay safe! 🪿',
  },
  {
    keywords: ['hours', 'open', 'close', 'when'],
    reply: 'Peters Library: 8 AM – 12 AM. Dining Hall: 7 AM – 9 PM. Byte Café: 7:30 AM – 8 PM. Athletic Complex: 6 AM – 11 PM ☕',
  },
  {
    keywords: ['study', 'quiet', 'work', 'seat'],
    reply: 'Peters Library 2nd floor is only 40% full right now — great for quiet study. Lazaridis Atrium is 25% full and has lots of natural light 📚',
  },
  {
    keywords: ['event', 'club', 'happening', 'week'],
    reply: 'This week: CS Hackathon (Nov 8, BA 202), Open Mic Night (Nov 9, Turret), Eco Fair (Nov 10, Concourse) 🎉',
  },
  {
    keywords: ['food', 'eat', 'dining', 'cafe', 'hungry', 'menu'],
    reply: 'Dining Hall has a new autumn menu this week! Byte Café and Wilf\'s Restaurant are also open on campus 🍽️',
  },
  {
    keywords: ['accessible', 'wheelchair', 'elevator', 'ramp', 'mobility'],
    reply: 'Most buildings have accessible entrances on University Ave. Peters Library has an east entrance ramp off Bricker Ave. Check the Accessible filter on the map tab for all locations ♿',
  },
  {
    keywords: ['shortcut', 'faster', 'tunnel', 'indoor'],
    reply: '⚡ There\'s an indoor tunnel connecting Peters Library to BA Building — saves about 4 minutes and keeps you dry in bad weather!',
  },
];

function getDemoReply(message: string): string {
  const lower = message.toLowerCase();
  for (const { keywords, reply } of DEMO_RESPONSES) {
    if (keywords.some((k) => lower.includes(k))) return reply;
  }
  return "I can help with indoor routes, building hours, study spaces, club events, goose alerts, and accessible entrances 🐥 What do you need?";
}

// ── Types ───────────────────────────────────────────────────────────────
type Message = { id: number; role: 'user' | 'bot'; text: string };

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

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (!API_BASE) throw new Error('no backend');

      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json() as { reply: string };
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: data.reply }]);
    } catch {
      // Fall back to local demo responses
      const reply = getDemoReply(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerSub}>Your campus companion</Text>
        </View>
      </View>

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListFooterComponent={loading ? <TypingIndicator /> : null}
      />

      {/* Input row */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask GoldenHawk…"
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
          editable={!loading}
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === 'bot';
  return (
    <View style={[styles.msgRow, !isBot && styles.msgRowUser]}>
      {isBot && <Text style={styles.msgAvatar}>🐥</Text>}
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, !isBot && styles.bubbleTextUser]}>
          {message.text}
        </Text>
      </View>
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
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  messageList:  { paddingHorizontal: 12, paddingTop: 12, gap: 12 },

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

  inputRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.1)' },
  input:        { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  sendBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.purple, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText:  { fontSize: 16, color: '#fff' },
});
