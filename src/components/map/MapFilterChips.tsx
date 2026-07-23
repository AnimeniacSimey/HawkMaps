/**
 * HawkMaps · src/components/map/MapFilterChips.tsx
 *
 * Horizontal scrollable row of toggle chips — one per MapLocationType.
 * Driven entirely by MAP_LAYER_CONFIG in locations.ts, so adding a new
 * location type automatically adds its chip here.
 */

import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { MAP_LAYER_CONFIG, MapLocationType } from '@/data/locations';

type Props = {
  visibleTypes: Set<MapLocationType>;
  onToggle:     (type: MapLocationType) => void;
};

export default function MapFilterChips({ visibleTypes, onToggle }: Props) {
  const types = Object.keys(MAP_LAYER_CONFIG) as MapLocationType[];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {types.map((type) => {
        const cfg    = MAP_LAYER_CONFIG[type];
        const active = visibleTypes.has(type);
        return (
          <TouchableOpacity
            key={type}
            style={[styles.chip, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
            onPress={() => onToggle(type)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {cfg.emoji} {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0.1,
    flexShrink: 0,
  },
  row: {
    flexDirection:   'row',
    gap:             8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    //alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth:      0.5,
    borderColor:      'rgba(0,0,0,0.15)',
    borderRadius:     20,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  chipText: {
    fontSize:   12,
    fontWeight: '500',
    color:      '#1a1a1a',
  },
  chipTextActive: {
    color:      '#fff',
    fontWeight: '700',
  },
});
