/**
 * HawkMaps · src/components/map/CampusMap.tsx
 *
 * Renders an interactive Leaflet map inside a WebView (Expo Go compatible).
 * All marker data and layer config comes from src/data/locations.ts —
 * that is the ONLY file you need to edit to add new pins or layers.
 *
 * Props
 *   locations       Array of MapLocation objects from locations.ts
 *   visibleTypes    Set of layer types currently toggled on (controlled by parent)
 *   onMarkerPress   Called with the MapLocation when a popup is tapped
 */

import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { MAP_LAYER_CONFIG, MapLocation, MapLocationType } from '@/data/locations';

type Props = {
  locations:     MapLocation[];
  visibleTypes:  Set<MapLocationType>;
  onMarkerPress?: (location: MapLocation) => void;
};

export default function CampusMap({ locations, visibleTypes, onMarkerPress }: Props) {
  // Serialise only the visible locations into the WebView HTML so we don't
  // ship unused data. The filter runs in JS-land before injection.
  const visible = locations.filter((l) => visibleTypes.has(l.type));

  // Build one JS statement per marker using a coloured CircleMarker + popup.
  const markersJS = visible
    .map((loc) => {
      const cfg  = MAP_LAYER_CONFIG[loc.type];
      const desc = loc.description ? `<p style='margin:4px 0 0;font-size:12px;color:#555'>${loc.description}</p>` : '';
      const hrs  = loc.hours       ? `<p style='margin:4px 0 0;font-size:11px;color:#888'>🕐 ${loc.hours}</p>`      : '';
      const acc  = loc.accessible  ? `<span style='font-size:11px'>♿ Accessible</span>`                             : '';
      const popup = `
        <div style='font-family:system-ui,sans-serif;min-width:160px'>
          <strong style='font-size:14px'>${cfg.emoji} ${loc.name}</strong>
          ${desc}${hrs}
          <div style='margin-top:6px'>${acc}</div>
        </div>`;
      // CircleMarker is lightweight (no image request) and works offline.
      return `
        L.circleMarker([${loc.latitude}, ${loc.longitude}], {
          radius: 10,
          fillColor: '${cfg.color}',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
        .addTo(map)
        .bindPopup(\`${popup.replace(/`/g, '\\`')}\`)
        .on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ id: ${loc.id} }));
        });`;
    })
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; }
    #map { height: 100vh; }
    /* Make attribution smaller so it doesn't overlap controls */
    .leaflet-control-attribution { font-size: 9px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([43.4732, -80.5278], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    ${markersJS}
  </script>
</body>
</html>`;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    if (!onMarkerPress) return;
    try {
      const { id } = JSON.parse(event.nativeEvent.data) as { id: number };
      const loc = locations.find((l) => l.id === id);
      if (loc) onMarkerPress(loc);
    } catch (_) {
      // ignore malformed messages
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.map}
        onMessage={handleMessage}
        // Needed on Android to allow loading Leaflet tiles
        mixedContentMode="always"
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },
});
