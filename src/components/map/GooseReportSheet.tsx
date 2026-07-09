/**
 * HawkMaps · src/components/map/GooseReportSheet.tsx
 *
 * Slide-up sheet for self-reporting a goose sighting. Opens after a student
 * long-presses a spot on the Map tab (see CampusMap's reportMode). Submits to
 * POST /api/goose on the Python backend (backend/main.py) — no auth required
 * for Sprint 1, matching /api/ai/chat.
 *
 * Styled to match LocationInfoCard so it feels like part of the same map UI.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BRAND } from '@/constants/theme';
import { API_BASE } from '@/constants/api';

export type GooseSeverity = 'mild' | 'aggressive';

export type GooseReportResult = {
  id:           number;
  lat:          number;
  lng:          number;
  severity:     GooseSeverity;
  note?:        string;
  reported_at:  string;
};

type Props = {
  visible:   boolean;
  lat:       number | null;
  lng:       number | null;
  onClose:   () => void;
  onSubmitted: (report: GooseReportResult) => void;
};

export default function GooseReportSheet({ visible, lat, lng, onClose, onSubmitted }: Props) {
  const [severity, setSeverity] = useState<GooseSeverity>('mild');
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const reset = () => {
    setSeverity('mild');
    setNote('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (lat == null || lng == null || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (!API_BASE) throw new Error('no backend configured');

      const res = await fetch(`${API_BASE}/api/goose`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lat, lng, severity, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error('report failed');

      const report = (await res.json()) as GooseReportResult;
      onSubmitted(report);
      reset();
    } catch {
      setError("Couldn't send that report — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.title}>🪿 Report a Goose</Text>
          <Text style={styles.subtitle}>
            {lat != null && lng != null
              ? `Dropped pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
              : 'Long-press a spot on the map to place a pin'}
          </Text>

          <Text style={styles.label}>How aggressive?</Text>
          <View style={styles.severityRow}>
            <SeverityButton
              label="🙂 Mild"
              active={severity === 'mild'}
              onPress={() => setSeverity('mild')}
            />
            <SeverityButton
              label="⚠️ Aggressive"
              active={severity === 'aggressive'}
              onPress={() => setSeverity('aggressive')}
            />
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. blocking the path near the library entrance"
            placeholderTextColor="#9ca3af"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={140}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (lat == null || loading) && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={lat == null || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Report Goose</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SeverityButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.severityBtn, active && styles.severityBtnActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.severityBtnText, active && styles.severityBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    justifyContent:  'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    backgroundColor:      '#fff',
    borderTopLeftRadius:  16,
    borderTopRightRadius: 16,
    paddingHorizontal:    16,
    paddingTop:           8,
    paddingBottom:        28,
    gap:                  4,
  },
  handle: {
    alignSelf:       'center',
    width:           36,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#e0e0e0',
    marginBottom:    12,
  },
  title:    { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 14 },
  label:    { fontSize: 12, fontWeight: '600', color: '#1a1a1a', marginTop: 10, marginBottom: 6 },

  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: {
    flex:              1,
    borderWidth:       0.5,
    borderColor:       'rgba(0,0,0,0.15)',
    borderRadius:      12,
    paddingVertical:   10,
    alignItems:        'center',
    backgroundColor:   '#fff',
  },
  severityBtnActive:     { backgroundColor: BRAND.purple, borderColor: BRAND.purple },
  severityBtnText:       { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  severityBtnTextActive: { color: '#fff' },

  input: {
    borderWidth:       0.5,
    borderColor:       'rgba(0,0,0,0.15)',
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   10,
    fontSize:          13,
    color:             '#1a1a1a',
    minHeight:         60,
    textAlignVertical:  'top',
  },

  error: { fontSize: 12, color: '#A32D2D', marginTop: 10 },

  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex:              1,
    borderRadius:      12,
    paddingVertical:   12,
    alignItems:        'center',
    backgroundColor:   '#f5f5f5',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  submitBtn: {
    flex:              1.4,
    borderRadius:      12,
    paddingVertical:   12,
    alignItems:        'center',
    backgroundColor:   BRAND.dark2,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});
