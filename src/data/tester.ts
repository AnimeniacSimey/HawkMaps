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
{
    id: 1,
    name: 'Arts A, C & E Wings',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 2,
    name: 'Bricker Academic',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 3,
    name: 'Centre for Cold Regions & Water',
    latitude: 43.47274,
    longitude: -80.52535,
    type: 'building',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 4,
    name: 'Concourse (Arts E)',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'study',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 5,
    name: 'DAWB Building',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 6,
    name: 'Frank Peters Building',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 7,
    name: 'John Aird Music (main + Theatre)',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'study',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 8,
    name: 'John Aird Music (practice wing)',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'study',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 9,
    name: 'Lazaridis Hall',
    latitude: 43.47512,
    longitude: -80.52954,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 10,
    name: 'Northdale Campus',
    latitude: 43.47641,
    longitude: -80.52703,
    type: 'building',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 11,
    name: 'Schlegel Building',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 12,
    name: 'Science Building',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 13,
    name: 'Science Research',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'study',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 14,
    name: 'Library',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'study',
    description: 'N/A',
    hours: '8:30 am – 11:00 pm, Mon - Thurs|8:30 am – 5:00 pm, Fri|11:00 am – 5:00 pm, Sun',
    accessible: true,
  },
{
    id: 15,
    name: 'University College',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am – 4:30 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 16,
    name: 'Department of Co-op and Career',
    latitude: 43.47411,
    longitude: -80.52282,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am – 4:30 pm, Mon/Tue/Thu/Fri|8:30 am – 7:00 pm, Wed',
    accessible: true,
  },
{
    id: 17,
    name: 'Dining Hall',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'food',
    description: 'N/A',
    hours: '7:00 am – 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 18,
    name: 'Welcome Centre (main entrance)',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am – 4:30 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 19,
    name: 'Regina St. Building',
    latitude: 43.47258,
    longitude: -80.52422,
    type: 'building',
    description: 'N/A',
    hours: '7:30 am – 5:00 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 20,
    name: '12 Lodge Street',
    latitude: 43.47165,
    longitude: -80.52512,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am – 4:30 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 21,
    name: '232 King Street North',
    latitude: 43.47554,
    longitude: -80.52223,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am – 5:00 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 22,
    name: 'Byte 75 Coffee & Social',
    latitude: 43.47512,
    longitude: -80.52954,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon - Fri',
    accessible: true,
  },
{
    id: 23,
    name: 'Frank\'s Coffee Haus',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon - Fri',
    accessible: true,
  },
{
    id: 24,
    name: 'Starbucks',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'food',
    description: 'N/A',
    hours: '7:30 am – 7:00 pm, Mon - Thu|7:30 am – 5:00 pm, Fri|9:00 am – 5:00 pm, Sat - Sun',
    accessible: true,
  },
{
    id: 25,
    name: 'Torque (Dining Hall)',
    latitude: 43.47231,
    longitude: -80.52892,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, 7 days',
    accessible: true,
  },
{
    id: 26,
    name: 'Terrace Food Court',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: '7:30 am – 7:00 pm, Mon - Thu|7:30 am – 5:00 pm, Fri|Closed, Sat - Sun',
    accessible: true,
  },
{
    id: 27,
    name: 'Union Market',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|10:00 am – 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 28,
    name: 'Harvey\'s',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|11:00 am – 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 29,
    name: 'El Torito',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|11:00 am – 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 30,
    name: 'Golden Dough Pie Co.',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|11:00 am – 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 31,
    name: 'Subway',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Fri|N/A, Sat-Sun',
    accessible: true,
  },
{
    id: 32,
    name: 'Tim Hortons',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Fri|N/A, Sat-Sun',
    accessible: true,
  },
{
    id: 33,
    name: 'Wilf\'s Restaurant & Bar',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'food',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 34,
    name: 'Hawk Shop (Bookstore & Merchandise)',
    latitude: 43.47382,
    longitude: -80.52684,
    type: 'building',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|N/A, Fri|N/A, Sat|N/A, Sun',
    accessible: true,
  },
{
    id: 35,
    name: 'International News',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'building',
    description: 'N/A',
    hours: '8:00 am – 10:00 pm, Mon-Fri|N/A, Sat-Sun',
    accessible: true,
  },
{
    id: 36,
    name: 'Hawk Hub (Printing Services)',
    latitude: 43.47335,
    longitude: -80.52712,
    type: 'building',
    description: 'N/A',
    hours: 'N/A, Mon & Thu|N/A, Tue & Wed|9:00 am – 4:00 pm, Fri',
    accessible: true,
  },
{
    id: 37,
    name: 'U-Desk (Students\' Union Desk)',
    latitude: 43.47312,
    longitude: -80.52824,
    type: 'building',
    description: 'N/A',
    hours: '9:00 am – 5:00 pm, Mon-Fri',
    accessible: true,
  },
{
    id: 38,
    name: 'Athletic Complex',
    latitude: 43.47345,
    longitude: -80.52752,
    type: 'building',
    description: 'N/A',
    hours: '6:00 am – 1:00 am, Mon - Thu|6:00 am – 10:00 pm, Fri|8:00 am – 10:00 pm, Sat|8:00 am – 1:00 am, Sun',
    accessible: true,
  },
];