/**
 * HawkMaps · src/app/index.tsx  (Map tab — the home screen)
 *
 * Manages layer visibility state and wires together:
 *   CampusMap         → Leaflet map in a WebView (also handles goose-report long-press)
 *   MapFilterChips    → toggle bar driven by MAP_LAYER_CONFIG
 *   LocationInfoCard  → slide-up detail card on marker tap
 *   GooseReportSheet  → slide-up form to submit a goose sighting
 *
 * To add a new *static* feature to the map, edit src/data/locations.ts.
 * Goose sightings are different: they're user-reported at runtime, fetched
 * from GET /api/goose and merged in below (falling back to the static demo
 * pins in locations.ts if the backend is unreachable).
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CampusMap        from '@/components/map/CampusMap';
import MapFilterChips   from '@/components/map/MapFilterChips';
import LocationInfoCard from '@/components/map/LocationInfoCard';
import GooseReportSheet, { GooseReportResult } from '@/components/map/GooseReportSheet';
import { locations as STATIC_LOCATIONS, MAP_LAYER_CONFIG, MapLocation, MapLocationType } from '@/data/locations';
import { API_BASE } from '@/constants/api';
import { BRAND } from '@/constants/theme';

// Goose reports fetched live from the backend get IDs offset well past any
// static location ID so they never collide with locations.ts entries.
const GOOSE_ID_OFFSET = 100_000;

function gooseReportToLocation(r: GooseReportResult): MapLocation {
  return {
    id:          GOOSE_ID_OFFSET + r.id,
    name:        r.severity === 'aggressive' ? 'Goose Alert (reported)' : 'Goose Sighting (reported)',
    latitude:    r.lat,
    longitude:   r.lng,
    type:        'goose',
    description: r.note || (r.severity === 'aggressive' ? '⚠️ Aggressive goose reported here.' : 'Goose spotted here.'),
  };
}

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
  const [visibleTypes,     setVisibleTypes]     = useState<Set<MapLocationType>>(buildDefaultVisibility);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  // Live goose reports from the backend. Starts as the static demo pins from
  // locations.ts so the map isn't empty before the fetch resolves / if the
  // backend is unreachable; replaced by live data once GET /api/goose succeeds.
  const [gooseLocations, setGooseLocations] = useState<MapLocation[]>(
    STATIC_LOCATIONS.filter((l) => l.type === 'goose')
  );

  // Goose report flow: reportMode arms long-press-to-drop-a-pin on the map;
  // pendingCoords holds the tapped spot while the sheet is open.
  const [reportMode,    setReportMode]    = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetVisible,  setSheetVisible]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadGooseReports() {
      if (!API_BASE) return; // no backend configured — keep the static demo pins
      try {
        const res = await fetch(`${API_BASE}/api/goose`);
        if (!res.ok) throw new Error('bad response');
        const data = (await res.json()) as GooseReportResult[];
        if (!cancelled) setGooseLocations(data.map(gooseReportToLocation));
      } catch {
        // Keep whatever was already showing (static demo pins) if this fails.
      }
    }
    loadGooseReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const nonGooseLocations = STATIC_LOCATIONS.filter((l) => l.type !== 'goose');
  const allLocations = [...nonGooseLocations, ...gooseLocations];

  const toggleType = (type: MapLocationType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const startReporting = () => {
    setSelectedLocation(null);
    setPendingCoords(null);
    setReportMode(true);
  };

  const cancelReporting = () => {
    setReportMode(false);
    setPendingCoords(null);
    setSheetVisible(false);
  };

  const handleMapLongPress = (lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setSheetVisible(true);
  };

  const handleReportSubmitted = (report: GooseReportResult) => {
    setGooseLocations((prev) => [...prev, gooseReportToLocation(report)]);
    cancelReporting();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Filter chips sit above the map */}
      <MapFilterChips visibleTypes={visibleTypes} onToggle={toggleType} />

      {/* Map fills remaining space */}
      <CampusMap
        locations={allLocations}
        visibleTypes={visibleTypes}
        onMarkerPress={setSelectedLocation}
        reportMode={reportMode}
        onMapLongPress={handleMapLongPress}
      />

      {/* Report Goose FAB — arms long-press mode; becomes a Cancel button once armed */}
      <TouchableOpacity
        style={[styles.fab, reportMode && styles.fabActive, { bottom: insets.bottom + 20 }]}
        onPress={reportMode ? cancelReporting : startReporting}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>{reportMode ? '✕ Cancel' : '🪿 Report Goose'}</Text>
      </TouchableOpacity>

      {/* Hint banner while armed, since long-press isn't self-explanatory */}
      {reportMode && (
        <View style={[styles.hintBanner, { top: insets.top + 56 }]}>
          <Text style={styles.hintText}>Long-press a spot on the map to drop a pin 🪿</Text>
        </View>
      )}

      {/* Info card overlays the map bottom when a marker is selected */}
      {selectedLocation && (
        <View style={styles.cardWrapper}>
          <LocationInfoCard
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        </View>
      )}

      <GooseReportSheet
        visible={sheetVisible}
        lat={pendingCoords?.lat ?? null}
        lng={pendingCoords?.lng ?? null}
        onClose={cancelReporting}
        onSubmitted={handleReportSubmitted}
      />
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
  fab: {
    position:          'absolute',
    right:             16,
    backgroundColor:   BRAND.dark2,
    borderRadius:       24,
    paddingHorizontal: 16,
    paddingVertical:   12,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.2,
    shadowRadius:      6,
    elevation:         6,
  },
  fabActive: { backgroundColor: '#A32D2D' },
  fabText:   { color: '#fff', fontSize: 13, fontWeight: '700' },

  hintBanner: {
    position:          'absolute',
    left:              16,
    right:             16,
    backgroundColor:   'rgba(26,26,26,0.85)',
    borderRadius:      10,
    paddingHorizontal: 12,
    paddingVertical:   8,
  },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
