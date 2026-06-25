/**
 * HawkMaps · src/data/locations.ts
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW MAP LOCATION
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Pick a type from the MapLocationType union below (or add a new one).
 * 2. Add a matching entry to MAP_LAYER_CONFIG so the map knows what colour/
 *    icon to use and whether the layer is visible by default.
 * 3. Append your location object to the `locations` array.
 *
 * That's it — the map, filter chips, and legend update automatically.
 *
 * Fields:
 *   id          Unique integer (increment from the last one)
 *   name        Display label shown in the popup / info card
 *   latitude    Decimal degrees (WGS84)
 *   longitude   Decimal degrees (WGS84)
 *   type        One of MapLocationType
 *   description Optional extra info shown in the popup
 *   hours       Optional hours string shown in the popup
 *   accessible  Set true to show ♿ badge in the popup
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Location types ────────────────────────────────────────────────────────
export type MapLocationType =
  | 'building'
  | 'study'
  | 'food'
  | 'event'
  | 'goose'       // user-reported goose sighting
  | 'closure'     // construction / temporarily closed area
  | 'accessible'  // accessible entrance / elevator
  | 'shortcut';   // student-reported shortcut

// ── Per-type display config ───────────────────────────────────────────────
// Add a row here whenever you introduce a new MapLocationType.
export type LayerConfig = {
  label:          string;   // shown in filter chip
  emoji:          string;   // Leaflet popup icon (emoji rendered in a DivIcon)
  color:          string;   // marker circle colour
  defaultVisible: boolean;  // is the layer toggled on when the map first loads?
};

export const MAP_LAYER_CONFIG: Record<MapLocationType, LayerConfig> = {
  building:   { label: 'Buildings',   emoji: '🏫', color: '#7B2FBE', defaultVisible: true  },
  study:      { label: 'Study',       emoji: '📚', color: '#3B6D11', defaultVisible: true  },
  food:       { label: 'Food',        emoji: '🍽️', color: '#C8991A', defaultVisible: true  },
  event:      { label: 'Events',      emoji: '🎉', color: '#0c447c', defaultVisible: true  },
  goose:      { label: 'Geese 🪿',    emoji: '🪿', color: '#854F0B', defaultVisible: true  },
  closure:    { label: 'Closures',    emoji: '🚧', color: '#A32D2D', defaultVisible: true  },
  accessible: { label: 'Accessible',  emoji: '♿', color: '#085041', defaultVisible: false },
  shortcut:   { label: 'Shortcuts',   emoji: '⚡', color: '#6B21A8', defaultVisible: false },
};

// ── Location data ─────────────────────────────────────────────────────────
export type MapLocation = {
  id:           number;
  name:         string;
  latitude:     number;
  longitude:    number;
  type:         MapLocationType;
  description?: string;
  hours?:       string;
  accessible?:  boolean;
};

export const locations: MapLocation[] = [
  // ── Buildings ────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Science Building',
    latitude: 43.4734,
    longitude: -80.5283,
    type: 'building',
    description: 'Labs, lecture halls, and faculty offices.',
    hours: '7:00 AM – 10:00 PM',
    accessible: true,
  },
  {
    id: 2,
    name: 'BA Building',
    latitude: 43.4730,
    longitude: -80.5275,
    type: 'building',
    description: 'Business & Economics faculty. Room 202 popular for club events.',
    hours: '7:30 AM – 10:30 PM',
    accessible: true,
  },
  {
    id: 3,
    name: 'Lazaridis Hall',
    latitude: 43.4726,
    longitude: -80.5270,
    type: 'building',
    description: 'Home of the Lazaridis School of Business & Economics.',
    hours: '7:00 AM – 11:00 PM',
    accessible: true,
  },
  {
    id: 4,
    name: 'Arts Building',
    latitude: 43.4738,
    longitude: -80.5290,
    type: 'building',
    description: 'Humanities and Social Sciences. Houses lecture theatres 1E1–1E6.',
    hours: '7:30 AM – 10:00 PM',
    accessible: true,
  },
  {
    id: 5,
    name: 'Athletic Complex',
    latitude: 43.4720,
    longitude: -80.5265,
    type: 'building',
    description: 'Gym, pool, squash courts, and fitness studios.',
    hours: '6:00 AM – 11:00 PM',
    accessible: true,
  },

  // ── Study spaces ─────────────────────────────────────────────────────
  {
    id: 10,
    name: 'Laurier Library',
    latitude: 43.4729,
    longitude: -80.5288,
    type: 'study',
    description: 'Main campus library. Quiet floors 2–4; collaborative floor 1.',
    hours: '8:00 AM – 12:00 AM',
    accessible: true,
  },
  {
    id: 11,
    name: 'Lazaridis Atrium',
    latitude: 43.4725,
    longitude: -80.5268,
    type: 'study',
    description: 'Open-concept study space with natural light. 50 seats.',
    hours: '7:00 AM – 11:00 PM',
  },
  {
    id: 12,
    name: 'BA Study Rooms',
    latitude: 43.4731,
    longitude: -80.5274,
    type: 'study',
    description: 'Bookable collaborative study rooms. 8 seats each.',
    hours: '7:30 AM – 10:30 PM',
  },

  // ── Food ─────────────────────────────────────────────────────────────
  {
    id: 20,
    name: 'Dining Hall',
    latitude: 43.4742,
    longitude: -80.5275,
    type: 'food',
    description: 'Full meal plan dining. New autumn menu this week!',
    hours: '7:00 AM – 9:00 PM',
    accessible: true,
  },
  {
    id: 21,
    name: 'Byte Café',
    latitude: 43.4728,
    longitude: -80.5285,
    type: 'food',
    description: 'Coffee, sandwiches, and snacks. Cash & meal plan accepted.',
    hours: '7:30 AM – 8:00 PM',
  },
  {
    id: 22,
    name: 'Wilf\'s Restaurant',
    latitude: 43.4735,
    longitude: -80.5278,
    type: 'food',
    description: 'Student-run restaurant. Great for a sit-down meal.',
    hours: '11:00 AM – 9:00 PM',
    accessible: true,
  },

  // ── Goose sightings (user-reported) ──────────────────────────────────
  {
    id: 30,
    name: 'Goose Alert — Alumni Hall',
    latitude: 43.4736,
    longitude: -80.5272,
    type: 'goose',
    description: '⚠️ Aggressive flock reported near Alumni Hall entrance. Use Seagram Dr side door.',
  },
  {
    id: 31,
    name: 'Goose Sighting — Library Path',
    latitude: 43.4731,
    longitude: -80.5290,
    type: 'goose',
    description: 'Mild sighting. Geese near the path between library and Science Building.',
  },

  // ── Closures ─────────────────────────────────────────────────────────
  {
    id: 40,
    name: 'Peters Building — Entrance Closed',
    latitude: 43.4733,
    longitude: -80.5280,
    type: 'closure',
    description: '🚧 Main entrance under repair until Nov 15. Use south entrance on King St.',
  },

  // ── Accessible entrances ──────────────────────────────────────────────
  {
    id: 50,
    name: 'Science Building — Accessible Entrance',
    latitude: 43.4733,
    longitude: -80.5282,
    type: 'accessible',
    description: 'Ramp and automatic doors on University Ave (west side).',
    accessible: true,
  },
  {
    id: 51,
    name: 'Library — Accessible Entrance',
    latitude: 43.4728,
    longitude: -80.5287,
    type: 'accessible',
    description: 'East entrance with ramp on Bricker Ave. Elevator inside.',
    accessible: true,
  },

  // ── Student shortcuts ─────────────────────────────────────────────────
  {
    id: 60,
    name: 'Indoor Tunnel — Peters to BA',
    latitude: 43.4732,
    longitude: -80.5279,
    type: 'shortcut',
    description: '⚡ Underground tunnel connects Peters Library to BA Building. Saves ~4 min in bad weather.',
  },
];
