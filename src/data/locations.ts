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
<<<<<<< Updated upstream
=======
    name: 'Arts A, C & E Wings',
    latitude: 43.47381,
    longitude: -80.52975,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 2,
    name: 'Bricker Academic',
    latitude: 43.47273,
    longitude: -80.52647,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 3,
    name: 'Centre for Cold Regions & Water',
    latitude: 43.47453,
    longitude: -80.52092,
    type: 'building',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 4,
    name: 'Concourse (Arts E)',
    latitude: 43.47390,
    longitude: -80.52945,
    type: 'study',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 5,
    name: 'DAWB Building',
    latitude: 43.47331,
    longitude: -80.52942,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 6,
    name: 'Frank Peters Building',
    latitude: 43.47371,
    longitude: -80.53055,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 7,
    name: 'John Aird Music (main + Theatre)',
    latitude: 43.47423,
    longitude: -80.52786,
    type: 'study',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 8,
    name: 'John Aird Music (practice wing)',
    latitude: 43.47449,
    longitude: -80.52823,
    type: 'study',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 9,
    name: 'Lazaridis Hall',
    latitude: 43.47503,
    longitude: -80.52947,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 10,
    name: 'Northdale Campus',
    latitude: 43.47764,
    longitude: -80.53150,
    type: 'building',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 11,
    name: 'Schlegel Building',
    latitude: 43.47328,
    longitude: -80.53032,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 12,
>>>>>>> Stashed changes
    name: 'Science Building',
    latitude: 43.4734,
    longitude: -80.5283,
    type: 'building',
<<<<<<< Updated upstream
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
=======
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 13,
    name: 'Science Research',
    latitude: 43.47306,
    longitude: -80.52599,
    type: 'study',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 14,
    name: 'Library',
    latitude: 43.47295,
    longitude: -80.52990,
    type: 'study',
    description: 'N/A',
    hours: '8:30 am ï¿½ 11:00 pm, Mon - Thurs|8:30 am ï¿½ 5:00 pm, Fri|11:00 am ï¿½ 5:00 pm, Sun',
    accessible: true,
  },
{
    id: 15,
    name: 'Martin Luther University College',
    latitude: 43.47203,
    longitude: -80.52873,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am ï¿½ 4:30 pm, Mon - Fri',
>>>>>>> Stashed changes
    accessible: true,
  },
  {
    id: 3,
    name: 'Lazaridis Hall',
    latitude: 43.4726,
    longitude: -80.5270,
    type: 'building',
<<<<<<< Updated upstream
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
=======
    description: 'N/A',
    hours: '8:30 am ï¿½ 4:30 pm, Mon/Tue/Thu/Fri|8:30 am ï¿½ 7:00 pm, Wed',
    accessible: true,
  },
{
    id: 17,
    name: 'Dining Hall',
    latitude: 43.47442,
    longitude: -80.52870,
    type: 'food',
    description: 'N/A',
    hours: '7:00 am ï¿½ 11:00 pm, 7 days',
    accessible: true,
  },
{
    id: 18,
    name: 'MacDonald House (main entrance)',
    latitude: 43.47375,
    longitude: -80.52799,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am ï¿½ 4:30 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 19,
    name: 'Regina Administration Building',
    latitude: 43.47470,
    longitude: -80.52267,
    type: 'building',
    description: 'N/A',
    hours: '7:30 am ï¿½ 5:00 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 20,
    name: 'Community and Workplace Partnerships',
    latitude: 43.47398,
    longitude: -80.52358,
    type: 'building',
    description: 'N/A',
    hours: '8:30 am ï¿½ 4:30 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 21,
    name: 'WLU Campus Police',
    latitude: 43.47538,
    longitude: -80.52445,
    type: 'building',
    description: 'N/A',
    hours: '7:00 am ï¿½ 5:00 pm, Mon - Fri',
    accessible: true,
  },
{
    id: 22,
    name: 'Byte 75 Coffee & Social',
    latitude: 43.47503,
    longitude: -80.52880,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon - Fri',
    accessible: true,
  },
{
    id: 23,
    name: 'Frank\'s Coffee Haus',
    latitude: 43.47354,
    longitude: -80.52868,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon - Fri',
    accessible: true,
  },
{
    id: 24,
    name: 'Starbucks',
    latitude: 43.47364,
    longitude: -80.52914,
    type: 'food',
    description: 'N/A',
    hours: '7:30 am ï¿½ 7:00 pm, Mon - Thu|7:30 am ï¿½ 5:00 pm, Fri|9:00 am ï¿½ 5:00 pm, Sat - Sun',
    accessible: true,
  },
{
    id: 25,
    name: 'Fresh Food Company (Dining Hall)',
    latitude: 43.47432,
    longitude: -80.52866,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, 7 days',
    accessible: true,
  },
{
    id: 26,
    name: 'Terrace Food Court',
    latitude: 43.47348,
    longitude: -80.52874,
    type: 'food',
    description: 'N/A',
    hours: '7:30 am ï¿½ 7:00 pm, Mon - Thu|7:30 am ï¿½ 5:00 pm, Fri|Closed, Sat - Sun',
    accessible: true,
  },
{
    id: 27,
    name: 'Union Market',
    latitude: 43.47339,
    longitude: -80.52858,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|10:00 am ï¿½ 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 28,
    name: 'Harvey\'s',
    latitude: 43.47343,
    longitude: -80.52882,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|11:00 am ï¿½ 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 29,
    name: 'El Torito',
    latitude: 43.47348,
    longitude: -80.52879,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|11:00 am ï¿½ 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 30,
    name: 'Golden Dough Pie Co.',
    latitude: 43.47343,
    longitude: -80.52873,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|11:00 am ï¿½ 8:00 pm, Fri-Sun',
    accessible: true,
  },
{
    id: 31,
    name: 'Subway',
    latitude: 43.47267,
    longitude: -80.52639,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Fri|N/A, Sat-Sun',
    accessible: true,
  },
{
    id: 32,
    name: 'Tim Hortons',
    latitude: 43.47320,
    longitude: -80.52552,
    type: 'food',
    description: 'N/A',
    hours: 'N/A, Mon-Fri|N/A, Sat-Sun',
    accessible: true,
  },
{
    id: 33,
    name: 'Wilf\'s Restaurant & Bar',
    latitude: 43.47352,
    longitude: -80.52877,
    type: 'food',
    description: 'N/A',
    hours: 'N/A',
    accessible: true,
  },
{
    id: 34,
    name: 'Hawk Shop (Bookstore & Merchandise)',
    latitude: 43.47339,
    longitude: -80.52944,
    type: 'building',
    description: 'N/A',
    hours: 'N/A, Mon-Thu|N/A, Fri|N/A, Sat|N/A, Sun',
    accessible: true,
  },
{
    id: 35,
    name: 'International News',
    latitude: 43.47358,
    longitude: -80.52866,
    type: 'building',
    description: 'N/A',
    hours: '8:00 am ï¿½ 10:00 pm, Mon-Fri|N/A, Sat-Sun',
    accessible: true,
  },
{
    id: 36,
    name: 'Hawk Hub (Printing Services)',
    latitude: 43.47370,
    longitude: -80.52931,
    type: 'building',
    description: 'N/A',
    hours: 'N/A, Mon & Thu|N/A, Tue & Wed|9:00 am ï¿½ 4:00 pm, Fri',
    accessible: true,
  },
{
    id: 37,
    name: 'U-Desk (Students\' Union Desk)',
    latitude: 43.47361,
    longitude: -80.52882,
    type: 'building',
    description: 'N/A',
    hours: '9:00 am ï¿½ 5:00 pm, Mon-Fri',
    accessible: true,
  },
{
    id: 38,
>>>>>>> Stashed changes
    name: 'Athletic Complex',
    latitude: 43.4720,
    longitude: -80.5265,
    type: 'building',
<<<<<<< Updated upstream
    description: 'Gym, pool, squash courts, and fitness studios.',
    hours: '6:00 AM – 11:00 PM',
=======
    description: 'N/A',
    hours: '6:00 am ï¿½ 1:00 am, Mon - Thu|6:00 am ï¿½ 10:00 pm, Fri|8:00 am ï¿½ 10:00 pm, Sat|8:00 am ï¿½ 1:00 am, Sun',
>>>>>>> Stashed changes
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
