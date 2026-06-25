/**
 * HawkMaps · src/components/map/LocationInfoCard.tsx
 *
 * Slide-up card shown at the bottom of the map when a marker is tapped.
 * Displays name, description, hours, and accessibility info.
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MAP_LAYER_CONFIG, MapLocation } from '@/data/locations';
import { BRAND } from '@/constants/theme';

type Props = {
  location: MapLocation;
  onClose:  () => void;
};

export default function LocationInfoCard({ location, onClose }: Props) {
  const cfg = MAP_LAYER_CONFIG[location.type];

  return (
    <View style={styles.card}>
      <View style={styles.handle} />

      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: cfg.color + '22' }]}>
          <Text style={styles.iconEmoji}>{cfg.emoji}</Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.name}>{location.name}</Text>
          {location.description ? (
            <Text style={styles.description}>{location.description}</Text>
          ) : null}
          {location.hours ? (
            <Text style={styles.hours}>🕐 {location.hours}</Text>
          ) : null}
          {location.accessible ? (
            <Text style={styles.accessible}>♿ Accessible entrance available</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius:  16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop:        8,
    paddingBottom:     20,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: -2 },
    shadowOpacity:     0.08,
    shadowRadius:      8,
    elevation:         8,
  },
  handle: {
    alignSelf:       'center',
    width:           36,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#e0e0e0',
    marginBottom:    12,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
  },
  iconBadge: {
    width:         44,
    height:        44,
    borderRadius:  12,
    alignItems:    'center',
    justifyContent:'center',
    flexShrink:    0,
  },
  iconEmoji: {
    fontSize: 22,
  },
  textBlock: {
    flex: 1,
    gap:  3,
  },
  name: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#1a1a1a',
  },
  description: {
    fontSize:   12,
    color:      '#6b7280',
    lineHeight: 17,
  },
  hours: {
    fontSize:   11,
    color:      '#9ca3af',
  },
  accessible: {
    fontSize:   11,
    color:      '#3B6D11',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color:    '#9ca3af',
  },
});
