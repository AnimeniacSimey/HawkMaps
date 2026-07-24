/**
 * HawkMaps · src/app/index.tsx  (Map tab — the home screen)
 *
 * Manages layer visibility state and wires together:
 *   CampusMap        → Leaflet map in a WebView
 *   MapFilterChips   → toggle bar driven by MAP_LAYER_CONFIG
 *   LocationInfoCard → slide-up detail card on marker tap
 *
 * To add a new feature to the map, edit src/data/locations.ts only.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CampusMap       from '@/components/map/CampusMap';
import MapFilterChips  from '@/components/map/MapFilterChips';
import LocationInfoCard from '@/components/map/LocationInfoCard';
import { locations, MAP_LAYER_CONFIG, MapLocation, MapLocationType } from '@/data/locations';

// Build the initial visibility set from each type's `defaultVisible` flag.
function buildDefaultVisibility(): Set<MapLocationType> {
  return new Set(
    (Object.keys(MAP_LAYER_CONFIG) as MapLocationType[]).filter(
      (t) => MAP_LAYER_CONFIG[t].defaultVisible
    )
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [visibleTypes,   setVisibleTypes]   = useState<Set<MapLocationType>>(buildDefaultVisibility);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  const toggleType = (type: MapLocationType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Filter chips sit above the map */}
      <MapFilterChips visibleTypes={visibleTypes} onToggle={toggleType} />

      {/* Map fills remaining space */}
      <CampusMap
        locations={locations}
        visibleTypes={visibleTypes}
        onMarkerPress={setSelectedLocation}
      />

      {/* Info card overlays the map bottom when a marker is selected */}
      {selectedLocation && (
        <View style={styles.cardWrapper}>
          <LocationInfoCard
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d4e8d0', // subtle green while map tiles load
  },
  cardWrapper: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
  },
});
