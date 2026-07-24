/**
 * HawkMaps · src/data/campus.ts
 *
 * Wilfrid Laurier University — WATERLOO campus. Building list, codes, addresses
 * and COORDINATES are taken from Laurier's official Concept3D campus map
 * (map.concept3d.com id=638) and hours from wlu.ca's building-hours schedule
 * (verified July 2026). Used by GoldenHawk's answer engine (src/lib/goldenhawkLocal.ts).
 *
 * CONNECTIONS: the connected:true buildings form Laurier's indoor academic
 * complex, linked through the Concourse (Arts E / Fred Nichols). Edge times are
 * estimates from the real layout — Laurier publishes no official tunnel map.
 * Bricker Academic <-> Science is a confirmed direct indoor connection.
 * Everything connected:false (Lazaridis Hall, Athletics, residences, off-block
 * buildings) is an outdoor walk; coordinates are exact so those estimates are good.
 */

export type Hours = { open: string; close: string }; // 24h "HH:MM"

export type Building = {
  id: string;
  name: string;
  code?: string;
  aliases: string[];
  roomPrefixes: string[];
  street: string;
  hours: Hours;
  contains: string;
  accessible?: string;
  connected: boolean;
  lat: number;
  lng: number;
};

export const BUILDINGS: Building[] = [
  { id: "alumni-hall", name: "Alumni Hall", code: "AH", aliases: ["ah", "alumni", "alumni hall"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "Development & Alumni Relations, University Advancement and the Office of Research Services", connected: true, lat: 43.47295, lng: -80.52843 },
  { id: "arts-c-wing", name: "Arts C Wing", code: "C", aliases: ["arts", "arts building", "arts c", "arts c wing", "c wing"], roomPrefixes: ["c"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "classrooms and the Accessible Learning Centre (first floor)", connected: true, lat: 43.4738, lng: -80.52981 },
  { id: "arts-e-wing", name: "Arts E Wing", code: "E", aliases: ["arts e", "arts e wing", "e wing"], roomPrefixes: ["e"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Department of Geography & Environmental Studies, the renovated 1E1 lecture hall and classrooms", connected: true, lat: 43.4738, lng: -80.52931 },
  { id: "bricker-academic-building", name: "Bricker Academic Building", code: "BA", aliases: ["ba", "ba building", "bricker", "bricker academic", "bricker academic building"], roomPrefixes: ["ba"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "Laurier's largest lecture halls (450 + two 200 seat) and Media Technology Services", connected: true, lat: 43.47282, lng: -80.52648 },
  { id: "dining-hall", name: "Dining Hall", code: "DH", aliases: ["caf", "dh", "dining", "dining hall", "fresh food", "fresh food co", "the caf"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Fresh Food Company dining hall", connected: true, lat: 43.47437, lng: -80.52872 },
  { id: "dr-alvin-woods-building", name: "Dr. Alvin Woods Building", code: "DAWB", aliases: ["alvin woods", "dawb", "dr. alvin woods", "dr. alvin woods building", "woods", "woods building"], roomPrefixes: ["dawb"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Faculty of Arts (Political Science, History, English, Philosophy, Sociology and more), active-learning classrooms and quiet study rooms on floors 3-5", connected: true, lat: 43.47339, lng: -80.5294 },
  { id: "frank-c-peters-building", name: "Frank C. Peters Building", code: "P", aliases: ["frank c. peters", "frank c. peters building", "frank peters", "p", "p building", "peters"], roomPrefixes: ["p"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "classrooms and study rooms; connects to the Library", connected: true, lat: 43.47364, lng: -80.5306 },
  { id: "fred-nichols-campus-centre", name: "Fred Nichols Campus Centre", code: "FN", aliases: ["24 lounge", "campus centre", "concourse", "fn", "fnc", "fncc", "fred nichols campus", "fred nichols campus centre", "student centre", "the hub", "turret", "wilf's", "wilfs"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Concourse, 24-Hour Lounge, Solarium, Turret, Wilf\u2019s, food and the Students\u2019 Union", connected: true, lat: 43.4737, lng: -80.52868 },
  { id: "library", name: "Library", code: "L", aliases: ["l", "lib", "library", "the lib", "the library"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "08:00", close: "00:00" }, contains: "computer labs, group study rooms and a caf\u00e9; open 24h during exams", connected: true, lat: 43.47296, lng: -80.52997 },
  { id: "savvas-chamberlain-music-building", name: "Savvas Chamberlain Music Building", code: "M", aliases: ["chamberlain", "music", "music building", "savvas chamberlain music", "savvas chamberlain music building"], roomPrefixes: ["m"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Faculty of Music, the Maureen Forester Recital Hall (320 seats), practice studios and study rooms", connected: true, lat: 43.47473, lng: -80.52784 },
  { id: "schlegel-building", name: "Schlegel Building", code: "SB", aliases: ["sb", "sb building", "schlegel", "schlegel building"], roomPrefixes: ["sb"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "academic lectures plus Enrolment Services - Service Laurier, Recruitment & Admissions and the Registrar's Office", connected: true, lat: 43.47342, lng: -80.53031 },
  { id: "science-building", name: "Science Building", code: "N", aliases: ["n", "n building", "sci", "science", "science building", "tim hortons", "timmies", "tims"], roomPrefixes: ["n"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Faculty of Science (Chemistry, Computer Science, Physics, Photonics, Psychology), labs, lecture halls, a Tim Hortons and atrium study space", connected: true, lat: 43.47355, lng: -80.5248 },
  { id: "science-research-centre", name: "Science Research Centre", code: "SR", aliases: ["science research", "science research centre", "sr"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "00:00", close: "00:00" }, contains: "research facilities", connected: true, lat: 43.47319, lng: -80.52596 },
  { id: "student-services-building", name: "Student Services Building", aliases: ["student services", "student services building", "students services"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Wellness Centre (upper level), the Grad Students' Association and Veritas Cafe (lower level)", connected: true, lat: 43.47402, lng: -80.5287 },
  { id: "theatre-auditorium", name: "Theatre Auditorium", code: "TA", aliases: ["theatre", "theatre auditorium"], roomPrefixes: ["ta"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "the Theatre Auditorium performance space", connected: true, lat: 43.47421, lng: -80.52788 },
  { id: "165-albert-st", name: "165 Albert St", aliases: ["165 albert st"], roomPrefixes: [], street: "165 Albert St", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47166, lng: -80.52983 },
  { id: "19-ezra-ave-upper-year", name: "19 Ezra Ave (Upper Year)", aliases: ["19 ezra", "19 ezra ave (upper year)"], roomPrefixes: [], street: "19 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47168, lng: -80.52504 },
  { id: "201-lester-st", name: "201 Lester St", aliases: ["201 lester", "201 lester st"], roomPrefixes: [], street: "201 Lester St", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47181, lng: -80.53312 },
  { id: "202-lester-st", name: "202 Lester St", aliases: ["202 lester", "202 lester st"], roomPrefixes: [], street: "202 Lester St", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47248, lng: -80.53316 },
  { id: "202-regina-street", name: "202 Regina Street", code: "R", aliases: ["202 regina street", "r"], roomPrefixes: [], street: "202 Regina Street", hours: { open: "07:30", close: "17:00" }, contains: "campus services and offices", connected: false, lat: 43.47486, lng: -80.52243 },
  { id: "230-regina-st", name: "230 Regina St", aliases: ["230 regina st"], roomPrefixes: [], street: "230 Regina St", hours: { open: "07:30", close: "17:00" }, contains: "campus services and offices", connected: false, lat: 43.47591, lng: -80.5228 },
  { id: "260-regina-st-apartments", name: "260 Regina St. Apartments", aliases: ["260 regina", "260 regina st. apartments"], roomPrefixes: [], street: "260 Regina St. Apartments", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47773, lng: -80.52367 },
  { id: "32-university-apartments", name: "32 University Apartments", aliases: ["32 university", "32 university apartments"], roomPrefixes: [], street: "32 University Apartments", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47722, lng: -80.52287 },
  { id: "33-ezra-ave-upper-year", name: "33 Ezra Ave (Upper Year)", aliases: ["33 ezra", "33 ezra ave (upper year)"], roomPrefixes: [], street: "33 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47149, lng: -80.52568 },
  { id: "39-ezra-ave-upper-year", name: "39 Ezra Ave (Upper Year)", aliases: ["39 ezra", "39 ezra ave (upper year)"], roomPrefixes: [], street: "39 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47127, lng: -80.52616 },
  { id: "43-ezra-ave-upper-year", name: "43 Ezra Ave (Upper Year)", aliases: ["43 ezra", "43 ezra ave (upper year)"], roomPrefixes: [], street: "43 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47107, lng: -80.5267 },
  { id: "52-ezra-ave-upper-year", name: "52 Ezra Ave (Upper Year)", aliases: ["52 ezra", "52 ezra ave (upper year)"], roomPrefixes: [], street: "52 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47145, lng: -80.52711 },
  { id: "53-bricker-upper-year", name: "53 Bricker (Upper Year)", aliases: ["53 bricker", "53 bricker (upper year)"], roomPrefixes: [], street: "53 Bricker (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47155, lng: -80.52817 },
  { id: "55-59-ezra-ave-upper-year", name: "55-59 Ezra Ave (Upper Year)", aliases: ["55 ezra", "55-59 ezra", "55-59 ezra ave (upper year)", "59 ezra"], roomPrefixes: [], street: "55-59 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47096, lng: -80.52724 },
  { id: "60-ezra-ave-upper-year", name: "60 Ezra Ave (Upper Year)", aliases: ["60 ezra", "60 ezra ave (upper year)"], roomPrefixes: [], street: "60 Ezra Ave (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47127, lng: -80.52765 },
  { id: "62-hickory-st-e-upper-year", name: "62 Hickory St E (Upper Year)", aliases: ["62 hickory", "62 hickory st e (upper year)"], roomPrefixes: [], street: "62 Hickory St E (Upper Year)", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47775, lng: -80.53053 },
  { id: "alumni-field", name: "Alumni Field", aliases: ["alumni field"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "06:00", close: "23:00" }, contains: "athletics and recreation facilities", connected: false, lat: 43.4743, lng: -80.52538 },
  { id: "athletic-complex", name: "Athletic Complex", code: "AC", aliases: ["ac", "athletic center", "athletic centre", "athletic complex", "athletics", "gym", "rec center", "rec centre", "the ac"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "06:00", close: "23:00" }, contains: "a large fitness centre, three gymnasiums, squash courts, varsity teams and intramurals", connected: false, lat: 43.47526, lng: -80.5255 },
  { id: "bouckaert-hall-residence", name: "Bouckaert Hall Residence", aliases: ["bouckaert", "bouckaert hall", "bouckaert hall residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47302, lng: -80.52718 },
  { id: "bricker-residence", name: "Bricker Residence", aliases: ["bricker", "bricker res", "bricker residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.4725, lng: -80.52749 },
  { id: "centre-for-cold-regions-and-water-science", name: "Centre for Cold Regions and Water Science", code: "CRW", aliases: ["centre for cold regions and water science", "crw", "for cold regions and water science"], roomPrefixes: [], street: "65 Lodge St", hours: { open: "00:00", close: "00:00" }, contains: "research facilities", connected: false, lat: 43.47456, lng: -80.52093 },
  { id: "co-operative-education-career-development-centre", name: "Co-operative Education & Career Development Centre", aliases: ["co-operative education & career development", "co-operative education & career development centre"], roomPrefixes: [], street: "192 King St N", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47404, lng: -80.52411 },
  { id: "conrad-hall-residence", name: "Conrad Hall Residence", aliases: ["clara conrad hall", "conrad", "conrad hall residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47493, lng: -80.52678 },
  { id: "euler-residence", name: "Euler Residence", aliases: ["euler", "euler residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47298, lng: -80.52793 },
  { id: "indigenous-student-centre", name: "Indigenous Student Centre", aliases: ["indigenous student", "indigenous student centre"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47144, lng: -80.52947 },
  { id: "king-street-residence", name: "King Street Residence", aliases: ["king street", "king street residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47462, lng: -80.52415 },
  { id: "king-s-court-residence", name: "King's Court Residence", aliases: ["king court", "king's court", "king's court residence", "kings court"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.48107, lng: -80.52629 },
  { id: "laurier-bookstore-tech-shop", name: "Laurier Bookstore/Tech Shop", aliases: ["laurier bookstore/tech shop"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47362, lng: -80.52905 },
  { id: "laurier-international", name: "Laurier International", aliases: ["laurier international"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47373, lng: -80.53015 },
  { id: "lazaridis-hall", name: "Lazaridis Hall", code: "LH", aliases: ["biz building", "business", "business building", "laz", "laz hall", "lazaridis", "lazaridis hall", "lh"], roomPrefixes: ["lh"], street: "64 University Ave W (across University Ave)", hours: { open: "07:00", close: "23:00" }, contains: "the Lazaridis School of Business & Economics, the Department of Mathematics, the Schlegel Centre for Entrepreneurship (LaunchPad), lecture halls and a bright atrium", connected: false, lat: 43.47506, lng: -80.52949 },
  { id: "leupold-residence", name: "Leupold Residence", aliases: ["leupold", "leupold hall", "leupold residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47272, lng: -80.52824 },
  { id: "little-house-residence", name: "Little House Residence", aliases: ["little house", "little house residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47335, lng: -80.52776 },
  { id: "lodge-administration-building", name: "Lodge Administration Building", code: "LAB", aliases: ["lab", "lodge administration", "lodge administration building"], roomPrefixes: ["lab"], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "lecture halls and classrooms", connected: false, lat: 43.47407, lng: -80.52213 },
  { id: "macdonald-house-residence", name: "Macdonald House Residence", code: "MC", aliases: ["mac", "machouse", "macdonald", "macdonald house", "macdonald house residence", "mc"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47377, lng: -80.52801 },
  { id: "marshall-st-apartments", name: "Marshall St. Apartments", aliases: ["marshall", "marshall apartments", "marshall st", "marshall st. apartments"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47362, lng: -80.52148 },
  { id: "martin-luther-university-college", name: "Martin Luther University College", code: "ML", aliases: ["martin luther university college", "ml"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47192, lng: -80.5288 },
  { id: "mathematics-assistance-centre", name: "Mathematics Assistance Centre", aliases: ["mathematics assistance", "mathematics assistance centre"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47488, lng: -80.52937 },
  { id: "northdale-science-research-building", name: "Northdale Science Research Building", code: "NC", aliases: ["nc", "northdale science research", "northdale science research building"], roomPrefixes: [], street: "66 Hickory St W (Northdale)", hours: { open: "00:00", close: "00:00" }, contains: "research facilities", connected: false, lat: 43.47765, lng: -80.53153 },
  { id: "onecard-office", name: "OneCard Office", aliases: ["onecard office"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47385, lng: -80.52938 },
  { id: "regina-residence", name: "Regina Residence", aliases: ["regina", "regina residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47497, lng: -80.52351 },
  { id: "schlegel-centre-for-entrepreneurship-and-social-innovation", name: "Schlegel Centre for Entrepreneurship and Social Innovation", aliases: ["schlegel centre for entrepreneurship and social innovation", "schlegel for entrepreneurship and social innovation"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47514, lng: -80.52925 },
  { id: "service-laurier", name: "Service Laurier", aliases: ["service laurier"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47342, lng: -80.53047 },
  { id: "student-wellness-centre", name: "Student Wellness Centre", aliases: ["student wellness", "student wellness centre"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47403, lng: -80.52873 },
  { id: "teaching-and-learning-commons", name: "Teaching and Learning Commons", aliases: ["teaching and learning commons"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47376, lng: -80.53055 },
  { id: "university-place-residence", name: "University Place Residence", aliases: ["university place", "university place residence"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.47781, lng: -80.52207 },
  { id: "university-stadium", name: "University Stadium", code: "US", aliases: ["stadium", "university stadium", "us"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "06:00", close: "23:00" }, contains: "athletics and recreation facilities", connected: false, lat: 43.4703, lng: -80.53002 },
  { id: "waterloo-college-hall", name: "Waterloo College Hall", aliases: ["waterloo college", "waterloo college hall"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.4715, lng: -80.53169 },
  { id: "welcome-centre", name: "Welcome Centre", aliases: ["welcome", "welcome centre"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47364, lng: -80.53033 },
  { id: "wellness-education-centre", name: "Wellness Education Centre", aliases: ["wellness education", "wellness education centre"], roomPrefixes: [], street: "75 University Ave W (main campus)", hours: { open: "07:00", close: "23:00" }, contains: "campus services and offices", connected: false, lat: 43.47406, lng: -80.52872 },
  { id: "willison-hall-residence", name: "Willison Hall Residence", aliases: ["willison", "willison hall", "willison hall residence", "willy"], roomPrefixes: [], street: "Main campus residence", hours: { open: "00:00", close: "00:00" }, contains: "a student residence (resident card access)", connected: false, lat: 43.4737, lng: -80.52678 },
];

export type Connection = { a: string; b: string; kind: string; minutes: number; covered: boolean; note: string };

export const CONNECTIONS: Connection[] = [
  { a: "arts-c-wing", b: "arts-e-wing", kind: "indoor link", minutes: 1, covered: true, note: "The two Arts wings connect indoors." },
  { a: "arts-e-wing", b: "fred-nichols-campus-centre", kind: "indoor link through the Concourse", minutes: 1, covered: true, note: "The Concourse sits at the Arts E end." },
  { a: "arts-e-wing", b: "dining-hall", kind: "indoor link", minutes: 1, covered: true, note: "Indoors between Arts E and the Dining Hall." },
  { a: "fred-nichols-campus-centre", b: "dining-hall", kind: "indoor link", minutes: 1, covered: true, note: "Straight through to the Dining Hall." },
  { a: "fred-nichols-campus-centre", b: "student-services-building", kind: "indoor link", minutes: 1, covered: true, note: "Student Services sits beside the Concourse." },
  { a: "fred-nichols-campus-centre", b: "alumni-hall", kind: "indoor link", minutes: 1, covered: true, note: "Indoors to Alumni Hall." },
  { a: "dining-hall", b: "savvas-chamberlain-music-building", kind: "indoor link", minutes: 1, covered: true, note: "Indoors toward the Music Building." },
  { a: "savvas-chamberlain-music-building", b: "theatre-auditorium", kind: "indoor link", minutes: 1, covered: true, note: "The Theatre Auditorium adjoins the Music Building." },
  { a: "arts-c-wing", b: "dr-alvin-woods-building", kind: "indoor link", minutes: 1, covered: true, note: "Indoors between Arts C and DAWB." },
  { a: "dr-alvin-woods-building", b: "schlegel-building", kind: "indoor link", minutes: 1, covered: true, note: "Indoors between DAWB and Schlegel." },
  { a: "schlegel-building", b: "frank-c-peters-building", kind: "indoor link", minutes: 1, covered: true, note: "Peters and Schlegel connect indoors." },
  { a: "frank-c-peters-building", b: "library", kind: "indoor link", minutes: 1, covered: true, note: "The Library connects to the Peters Building." },
  { a: "bricker-academic-building", b: "science-building", kind: "indoor link", minutes: 2, covered: true, note: "Bricker Academic connects directly to the Science Building." },
  { a: "science-building", b: "science-research-centre", kind: "indoor link", minutes: 1, covered: true, note: "The Science Research Centre adjoins the Science Building." },
  { a: "bricker-academic-building", b: "alumni-hall", kind: "indoor link through the Concourse", minutes: 2, covered: true, note: "Bricker links toward Alumni Hall and the Concourse." },
];

// Real centrally-scheduled classrooms (code, building, floor, capacity, type).
// Source: students.wlu.ca classrooms list (verified July 2026). Floor = first digit.
export type Room = { code: string; building: string; floor: number; capacity: number; type: string };
export const ROOMS: Room[] = [
  { code: "N1001", building: "science-building", floor: 1, capacity: 280, type: "lecture theatre" },
  { code: "N1002", building: "science-building", floor: 1, capacity: 150, type: "lecture theatre" },
  { code: "N1042", building: "science-building", floor: 1, capacity: 40, type: "active-learning classroom" },
  { code: "N1044", building: "science-building", floor: 1, capacity: 90, type: "lecture theatre" },
  { code: "N1055", building: "science-building", floor: 1, capacity: 30, type: "computer lab" },
  { code: "N1057", building: "science-building", floor: 1, capacity: 50, type: "traditional classroom" },
  { code: "N1059", building: "science-building", floor: 1, capacity: 25, type: "traditional classroom" },
  { code: "BA101", building: "bricker-academic-building", floor: 1, capacity: 200, type: "lecture theatre" },
  { code: "BA102", building: "bricker-academic-building", floor: 1, capacity: 200, type: "lecture theatre" },
  { code: "BA110", building: "bricker-academic-building", floor: 1, capacity: 100, type: "tablet-desk classroom" },
  { code: "BA111", building: "bricker-academic-building", floor: 1, capacity: 100, type: "tablet-desk classroom" },
  { code: "BA112", building: "bricker-academic-building", floor: 1, capacity: 65, type: "tablet-desk classroom" },
  { code: "BA113", building: "bricker-academic-building", floor: 1, capacity: 55, type: "computer lab" },
  { code: "BA201", building: "bricker-academic-building", floor: 2, capacity: 452, type: "lecture theatre" },
  { code: "BA202", building: "bricker-academic-building", floor: 2, capacity: 85, type: "tablet-desk classroom" },
  { code: "BA206", building: "bricker-academic-building", floor: 2, capacity: 30, type: "computer lab" },
  { code: "BA207", building: "bricker-academic-building", floor: 2, capacity: 30, type: "computer lab" },
  { code: "BA208", building: "bricker-academic-building", floor: 2, capacity: 83, type: "tablet-desk classroom" },
  { code: "BA209", building: "bricker-academic-building", floor: 2, capacity: 83, type: "tablet-desk classroom" },
  { code: "BA210", building: "bricker-academic-building", floor: 2, capacity: 77, type: "tablet-desk classroom" },
  { code: "BA211", building: "bricker-academic-building", floor: 2, capacity: 77, type: "tablet-desk classroom" },
  { code: "BA305", building: "bricker-academic-building", floor: 3, capacity: 40, type: "flexible learning space" },
  { code: "BA306", building: "bricker-academic-building", floor: 3, capacity: 40, type: "flexible learning space" },
  { code: "BA307", building: "bricker-academic-building", floor: 3, capacity: 35, type: "flexible learning space" },
  { code: "BA308", building: "bricker-academic-building", floor: 3, capacity: 35, type: "flexible learning space" },
  { code: "BA429", building: "bricker-academic-building", floor: 4, capacity: 50, type: "traditional classroom" },
  { code: "BA431", building: "bricker-academic-building", floor: 4, capacity: 25, type: "tablet-desk classroom" },
  { code: "LH1001", building: "lazaridis-hall", floor: 1, capacity: 1002, type: "lecture theatre" },
  { code: "LH1009", building: "lazaridis-hall", floor: 1, capacity: 147, type: "case-study room" },
  { code: "LH1010", building: "lazaridis-hall", floor: 1, capacity: 147, type: "case-study room" },
  { code: "LH1011", building: "lazaridis-hall", floor: 1, capacity: 147, type: "case-study room" },
  { code: "LH2062", building: "lazaridis-hall", floor: 2, capacity: 72, type: "case-study room" },
  { code: "LH2064", building: "lazaridis-hall", floor: 2, capacity: 72, type: "case-study room" },
  { code: "LH2066", building: "lazaridis-hall", floor: 2, capacity: 72, type: "case-study room" },
  { code: "LH3094", building: "lazaridis-hall", floor: 3, capacity: 295, type: "lecture theatre" },
  { code: "LH3098", building: "lazaridis-hall", floor: 3, capacity: 64, type: "active-learning classroom" },
  { code: "LH3101", building: "lazaridis-hall", floor: 3, capacity: 64, type: "active-learning classroom" },
  { code: "DAWB 1-101A", building: "dr-alvin-woods-building", floor: 1, capacity: 40, type: "flexible learning space" },
  { code: "DAWB 2-101", building: "dr-alvin-woods-building", floor: 2, capacity: 52, type: "traditional classroom" },
  { code: "DAWB 2-104", building: "dr-alvin-woods-building", floor: 2, capacity: 72, type: "active-learning classroom" },
  { code: "DAWB 2-105", building: "dr-alvin-woods-building", floor: 2, capacity: 56, type: "traditional classroom" },
  { code: "DAWB 2-106", building: "dr-alvin-woods-building", floor: 2, capacity: 104, type: "tablet-desk classroom" },
  { code: "DAWB 2-108", building: "dr-alvin-woods-building", floor: 2, capacity: 62, type: "traditional classroom" },
  { code: "DAWB 3-103", building: "dr-alvin-woods-building", floor: 3, capacity: 35, type: "traditional classroom" },
  { code: "DAWB 3-105", building: "dr-alvin-woods-building", floor: 3, capacity: 28, type: "flexible learning space" },
  { code: "DAWB 3-106", building: "dr-alvin-woods-building", floor: 3, capacity: 40, type: "active-learning classroom" },
  { code: "DAWB 4-101", building: "dr-alvin-woods-building", floor: 4, capacity: 10, type: "seminar room" },
  { code: "DAWB 4-106", building: "dr-alvin-woods-building", floor: 4, capacity: 18, type: "seminar room" },
  { code: "P110", building: "frank-c-peters-building", floor: 1, capacity: 212, type: "lecture theatre" },
  { code: "P115", building: "frank-c-peters-building", floor: 1, capacity: 60, type: "case-study room" },
  { code: "P118", building: "frank-c-peters-building", floor: 1, capacity: 40, type: "flexible learning space" },
  { code: "P120", building: "frank-c-peters-building", floor: 1, capacity: 60, type: "case-study room" },
  { code: "P327", building: "frank-c-peters-building", floor: 3, capacity: 40, type: "traditional classroom" },
  { code: "P331", building: "frank-c-peters-building", floor: 3, capacity: 20, type: "flexible learning space" },
  { code: "P351", building: "frank-c-peters-building", floor: 3, capacity: 20, type: "flexible learning space" },
  { code: "SB103", building: "schlegel-building", floor: 1, capacity: 65, type: "case-study room" },
  { code: "SB105", building: "schlegel-building", floor: 1, capacity: 43, type: "case-study room" },
  { code: "SB106", building: "schlegel-building", floor: 1, capacity: 124, type: "case-study room" },
  { code: "SB107", building: "schlegel-building", floor: 1, capacity: 70, type: "case-study room" },
  { code: "SB203", building: "schlegel-building", floor: 2, capacity: 64, type: "case-study room" },
  { code: "SB204", building: "schlegel-building", floor: 2, capacity: 66, type: "case-study room" },
  { code: "SB305", building: "schlegel-building", floor: 3, capacity: 60, type: "flexible learning space" },
  { code: "1C16", building: "arts-c-wing", floor: 1, capacity: 68, type: "tablet-desk classroom" },
  { code: "1C17", building: "arts-c-wing", floor: 1, capacity: 67, type: "traditional classroom" },
  { code: "1C18", building: "arts-c-wing", floor: 1, capacity: 68, type: "tablet-desk classroom" },
  { code: "2C3", building: "arts-c-wing", floor: 2, capacity: 60, type: "case-study room" },
  { code: "2C4", building: "arts-c-wing", floor: 2, capacity: 54, type: "case-study room" },
  { code: "2C15", building: "arts-c-wing", floor: 2, capacity: 68, type: "tablet-desk classroom" },
  { code: "2C16", building: "arts-c-wing", floor: 2, capacity: 67, type: "traditional classroom" },
  { code: "2C17", building: "arts-c-wing", floor: 2, capacity: 68, type: "tablet-desk classroom" },
  { code: "1E1", building: "arts-e-wing", floor: 1, capacity: 297, type: "lecture theatre" },
  { code: "MLU101A", building: "martin-luther-university-college", floor: 1, capacity: 30, type: "traditional classroom" },
  { code: "MLU101B", building: "martin-luther-university-college", floor: 1, capacity: 30, type: "traditional classroom" },
  { code: "MLU201A", building: "martin-luther-university-college", floor: 2, capacity: 30, type: "traditional classroom" },
  { code: "MLU201B", building: "martin-luther-university-college", floor: 2, capacity: 30, type: "traditional classroom" },
  { code: "MLU201C", building: "martin-luther-university-college", floor: 2, capacity: 30, type: "traditional classroom" },
  { code: "MLU203", building: "martin-luther-university-college", floor: 2, capacity: 30, type: "traditional classroom" },
];

// Floor-by-floor directory where the official map lists it (Bricker only so far).
export type FloorEntry = { floor: number; has: string };
export const FLOORS: Record<string, FloorEntry[]> = {
  "bricker-academic-building": [
    { floor: 1, has: "lecture halls, a Math Assistance Centre satellite office and a multi-faith prayer room" },
    { floor: 2, has: "lecture halls and computer labs" },
    { floor: 3, has: "the Faculty of Education, the ICT and SharcNET offices and graduate student offices" },
    { floor: 4, has: "the Departments of Biology and Chemistry & Biochemistry, an undergrad study lounge and meeting rooms" },
    { floor: 5, has: "the Departments of Health Sciences and Kinesiology & Physical Education, meeting rooms and a computer lab" },
  ],
};

// Departments / faculties / services -> which building they live in. Powers
// "which building has Political Science?" and "where's the Registrar?".
export type DirEntry = { term: string; building: string; note?: string };
export const DIRECTORY: DirEntry[] = [
  { term: "faculty of education", building: "bricker-academic-building", note: "3rd floor" },
  { term: "education", building: "bricker-academic-building", note: "3rd floor" },
  { term: "biology", building: "bricker-academic-building", note: "4th floor" },
  { term: "chemistry", building: "bricker-academic-building", note: "4th floor" },
  { term: "biochemistry", building: "bricker-academic-building", note: "4th floor" },
  { term: "health sciences", building: "bricker-academic-building", note: "5th floor" },
  { term: "kinesiology", building: "bricker-academic-building", note: "5th floor" },
  { term: "physical education", building: "bricker-academic-building", note: "5th floor" },
  { term: "math assistance", building: "bricker-academic-building", note: "1st-floor satellite" },
  { term: "computer science", building: "science-building" },
  { term: "physics", building: "science-building" },
  { term: "photonics", building: "science-building" },
  { term: "psychology", building: "science-building" },
  { term: "dean of science", building: "science-building" },
  { term: "faculty of arts", building: "dr-alvin-woods-building" },
  { term: "political science", building: "dr-alvin-woods-building" },
  { term: "history", building: "dr-alvin-woods-building" },
  { term: "philosophy", building: "dr-alvin-woods-building" },
  { term: "sociology", building: "dr-alvin-woods-building" },
  { term: "english", building: "dr-alvin-woods-building" },
  { term: "religion", building: "dr-alvin-woods-building" },
  { term: "anthropology", building: "dr-alvin-woods-building" },
  { term: "cultural studies", building: "dr-alvin-woods-building" },
  { term: "film studies", building: "dr-alvin-woods-building" },
  { term: "global studies", building: "dr-alvin-woods-building" },
  { term: "languages", building: "dr-alvin-woods-building" },
  { term: "gender studies", building: "dr-alvin-woods-building" },
  { term: "geography", building: "arts-e-wing" },
  { term: "environmental studies", building: "arts-e-wing" },
  { term: "business", building: "lazaridis-hall" },
  { term: "economics", building: "lazaridis-hall" },
  { term: "mathematics", building: "lazaridis-hall" },
  { term: "math department", building: "lazaridis-hall" },
  { term: "entrepreneurship", building: "lazaridis-hall" },
  { term: "launchpad", building: "lazaridis-hall" },
  { term: "accessible learning", building: "arts-c-wing", note: "1st floor" },
  { term: "registrar", building: "schlegel-building" },
  { term: "service laurier", building: "schlegel-building" },
  { term: "admissions", building: "schlegel-building" },
  { term: "recruitment", building: "schlegel-building" },
  { term: "enrolment services", building: "schlegel-building" },
  { term: "welcome centre", building: "frank-c-peters-building" },
  { term: "teaching and learning commons", building: "frank-c-peters-building" },
  { term: "students' union", building: "fred-nichols-campus-centre" },
  { term: "students union", building: "fred-nichols-campus-centre" },
  { term: "bookstore", building: "fred-nichols-campus-centre" },
  { term: "onecard", building: "fred-nichols-campus-centre" },
  { term: "art gallery", building: "library", note: "Robert Langen Art Gallery" },
  { term: "wlu press", building: "library" },
  { term: "faculty of music", building: "savvas-chamberlain-music-building" },
  { term: "recital hall", building: "savvas-chamberlain-music-building" },
  { term: "maureen forester", building: "savvas-chamberlain-music-building" },
  { term: "fitness centre", building: "athletic-complex" },
  { term: "gym", building: "athletic-complex" },
  { term: "varsity", building: "athletic-complex" },
  { term: "intramural", building: "athletic-complex" },
  { term: "alumni relations", building: "alumni-hall" },
  { term: "research services", building: "alumni-hall" },
  { term: "wellness centre", building: "student-services-building" },
  { term: "grad students", building: "student-services-building" },
];

export type Closure = { building: string; detail: string; reroute: string };
export const CLOSURES: Closure[] = [];

export type Space = { name: string; building: string; fillPct: number; type: string; seats: number };
export const SPACES: Space[] = [
  { name: 'Library — group & quiet floors', building: 'Library',                     fillPct: 40, type: 'quiet',         seats: 60 },
  { name: 'DAWB quiet study rooms (fl 3-5)', building: 'Dr. Alvin Woods Building',    fillPct: 30, type: 'quiet',         seats: 40 },
  { name: 'Lazaridis Hall atrium',           building: 'Lazaridis Hall',             fillPct: 25, type: 'open',          seats: 80 },
  { name: 'Science Building atrium',         building: 'Science Building',            fillPct: 55, type: 'open',          seats: 50 },
  { name: 'FNCC 24-Hour Lounge',             building: 'Fred Nichols Campus Centre',  fillPct: 70, type: 'collaborative', seats: 40 },
];

export type CampusEvent = { title: string; club?: string; location: string; when: string };
export const EVENTS: CampusEvent[] = [
  { title: 'CS Club Hackathon', club: 'CS Club',   location: 'BA 202',        when: 'Fri 9 AM' },
  { title: 'Open Mic Night',    club: 'Music Club', location: 'Turret (FNCC)', when: 'Sat 7 PM' },
  { title: 'Eco Club Fair',     club: 'Eco Club',   location: 'Concourse',     when: 'Sun 11 AM' },
];

export type Goose = { severity: string; note: string };
export const GEESE: Goose[] = [
  { severity: 'aggressive', note: 'on the green near Alumni Field' },
  { severity: 'mild',       note: 'by the Science Building entrance' },
];