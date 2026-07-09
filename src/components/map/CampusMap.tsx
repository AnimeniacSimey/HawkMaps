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
 *   reportMode      When true, long-pressing the map drops a temporary pin and
 *                    calls onMapLongPress with the tapped coordinates, instead
 *                    of the normal marker-tap behaviour. Used for goose reports.
 *   onMapLongPress  Called with (lat, lng) when the map is long-pressed while
 *                    reportMode is true.
 */

import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { MAP_LAYER_CONFIG, MapLocation, MapLocationType } from '@/data/locations';

type Props = {
  locations:      MapLocation[];
  visibleTypes:   Set<MapLocationType>;
  onMarkerPress?: (location: MapLocation) => void;
  reportMode?:    boolean;
  onMapLongPress?: (lat: number, lng: number) => void;
};

export default function CampusMap({
  locations,
  visibleTypes,
  onMarkerPress,
  reportMode = false,
  onMapLongPress,
}: Props) {
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
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: ${loc.id} }));
        });`;
    })
    .join('\n');

  // In report mode, holding a touch still for ~550ms drops a temporary pin
  // and reports the coordinates back to React Native.
  //
  // We deliberately do NOT use Leaflet's built-in 'contextmenu' event here:
  // on iOS that event is only synthesized by WKWebView as part of its native
  // long-press-to-select-text gesture — and disabling that gesture (see the
  // -webkit-user-select / -webkit-touch-callout rules above, needed to stop
  // the native Copy/Look Up/Translate popup from stealing the long-press)
  // also silently disables the contextmenu event along with it. So instead
  // we time the press ourselves directly off touchstart/touchend, which
  // works regardless of those CSS settings.
  //
  // The pin is purely visual — it disappears the moment the WebView reloads
  // with new `html` (e.g. when the parent flips reportMode back off after the
  // report sheet closes), so there's nothing to clean up.
  const reportModeJS = reportMode
    ? `
    map.getContainer().style.cursor = 'crosshair';
    let _reportMarker = null;
    let _pressTimer = null;
    const LONG_PRESS_MS = 550;

    function _latLngFromEvent(e) {
      const touch = e.touches && e.touches.length ? e.touches[0] : e;
      const point = map.mouseEventToContainerPoint(touch);
      return map.containerPointToLatLng(point);
    }

    function _cancelPress() {
      if (_pressTimer) {
        clearTimeout(_pressTimer);
        _pressTimer = null;
      }
    }

    function _startPress(e) {
      if (e.touches && e.touches.length > 1) return; // ignore multi-touch (pinch/zoom)
      const latlng = _latLngFromEvent(e);
      _cancelPress();
      _pressTimer = setTimeout(function() {
        _pressTimer = null;
        if (_reportMarker) map.removeLayer(_reportMarker);
        _reportMarker = L.circleMarker([latlng.lat, latlng.lng], {
          radius: 11,
          fillColor: '#854F0B',
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.95,
        }).addTo(map);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'report-location',
          lat: latlng.lat,
          lng: latlng.lng,
        }));
      }, LONG_PRESS_MS);
    }

    const _mapContainer = map.getContainer();
    // touchmove/mousemove cancel the timer so a real map drag/pan doesn't
    // also register as a long-press report.
    _mapContainer.addEventListener('touchstart', _startPress, { passive: true });
    _mapContainer.addEventListener('touchend', _cancelPress);
    _mapContainer.addEventListener('touchcancel', _cancelPress);
    _mapContainer.addEventListener('touchmove', _cancelPress);
    _mapContainer.addEventListener('mousedown', _startPress);
    _mapContainer.addEventListener('mouseup', _cancelPress);
    _mapContainer.addEventListener('mousemove', _cancelPress);
    _mapContainer.addEventListener('mouseleave', _cancelPress);`
    : '';

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
    /* iOS (WKWebView) shows a native Copy/Look Up/Translate callout on any
       long-press by default, which steals the gesture before Leaflet's own
       long-press ('contextmenu') handler fires. Disabling text-selection and
       the long-press callout lets our handler receive it instead. */
    html, body, #map {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
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
    ${reportModeJS}
  </script>
</body>
</html>`;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as
        | { type: 'marker'; id: number }
        | { type: 'report-location'; lat: number; lng: number };

      if (msg.type === 'marker' && onMarkerPress) {
        const loc = locations.find((l) => l.id === msg.id);
        if (loc) onMarkerPress(loc);
      } else if (msg.type === 'report-location' && onMapLongPress) {
        onMapLongPress(msg.lat, msg.lng);
      }
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
        // Prevents iOS's 3D-touch/long-press link-preview from competing
        // with Leaflet's own long-press (contextmenu) handler
        allowsLinkPreview={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },
});
