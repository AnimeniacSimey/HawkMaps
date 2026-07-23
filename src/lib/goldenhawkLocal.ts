/**
 * HawkMaps · src/lib/goldenhawkLocal.ts
 *
 * GoldenHawk's on-device answer engine. Turns a student's message into a REAL,
 * data-grounded reply using src/data/campus.ts — resolving rooms to buildings,
 * finding the fastest indoor route (Dijkstra over covered connections), and
 * reporting live open/closed status. Used whenever the Python backend / live
 * LLM isn't reachable, so the chat is genuinely useful offline instead of
 * pasting canned text.
 */

import {
  BUILDINGS,
  CONNECTIONS,
  CLOSURES,
  ROOMS,
  FLOORS,
  DIRECTORY,
  SPACES,
  EVENTS,
  GEESE,
  type Building,
  type Room,
} from '@/data/campus';

// Known real classrooms, keyed by a normalized code (no spaces/dashes, upper).
const roomKey = (s: string) => s.toUpperCase().replace(/[\s-]/g, '');
const ROOM_MAP = new Map<string, Room>(ROOMS.map((r) => [roomKey(r.code), r]));

// Find a known classroom mentioned anywhere in the text. Handles letter-first
// codes (N1001, BA 201, DAWB 2-104, LH1001, MLU101A) and Arts codes (1C16, 1E1).
function lookupRoom(text: string): Room | null {
  const re = /\b([a-z]{1,4}\s*-?\s*\d[\d-]*[a-z]?|\d[ce]\d+)\b/gi;
  for (const m of text.matchAll(re)) {
    const hit = ROOM_MAP.get(roomKey(m[0]));
    if (hit) return hit;
  }
  return null;
}

// ── Time helpers ──────────────────────────────────────────────────────────
function toMin(hhmm: string): number | null {
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

function isOpenNow(open: string, close: string, nowMin: number): boolean | null {
  const o = toMin(open);
  const c = toMin(close);
  if (o === null || c === null || o === c) return null;
  return c > o ? nowMin >= o && nowMin < c : nowMin >= o || nowMin < c; // handle overnight
}

function fmtTime(hhmm: string): string {
  if (hhmm === '00:00') return 'midnight';
  const mins = toMin(hhmm);
  if (mins === null) return hhmm;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')} ${ampm}` : `${h} ${ampm}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// ── Location resolution (room code or building name) ──────────────────────
const byId = (id: string): Building => BUILDINGS.find((b) => b.id === id)!;

// prefix -> building id, longest first so "dawb"/"sbe"/"arts" beat "ba"/"n"/"p"
const PREFIX_TO_ID: [string, string][] = BUILDINGS
  .flatMap((b) => b.roomPrefixes.map((p) => [p, b.id] as [string, string]))
  .sort((a, b) => b[0].length - a[0].length);

const ROOM_ALT = PREFIX_TO_ID.map(([p]) => p).join('|');
// e.g. matches "DAWB 2-101", "N1001", "BA 202", "SBE 1230", "Arts 1E1", "P203"
const ROOM_RE = new RegExp(`\\b(${ROOM_ALT})\\s*-?\\s*(\\d[\\w-]*)`, 'i');

// Short aliases that collide with everyday words — never resolve on these.
const COMMON_WORD_ALIASES = new Set([
  'us', 'ah', 'ta', 'an', 'on', 'in', 'at', 'or', 'so', 'my', 'me', 'hi', 'ok', 'no',
]);

export type Resolved = { building: Building; room?: string; roomInfo?: Room };

export function resolveLocation(text: string): Resolved | null {
  const lower = text.toLowerCase();

  // 0) a known real classroom is the most specific — it pins the building.
  const known = lookupRoom(text);
  if (known) return { building: byId(known.building), room: known.code, roomInfo: known };

  // 1) explicit building name / alias — prefer the longest alias that matches
  let best: { building: Building; len: number } | null = null;
  for (const b of BUILDINGS) {
    for (const alias of [...b.aliases, b.name.toLowerCase()]) {
      // Skip 1-char and common-word aliases (e.g. code "US" for University
      // Stadium) — they false-match everyday words ("fish n chips", "toys r
      // us"). Room codes like N1001 still resolve via ROOM_RE below.
      if (alias.length < 2 || COMMON_WORD_ALIASES.has(alias)) continue;
      const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(lower) && (!best || alias.length > best.len)) {
        best = { building: b, len: alias.length };
      }
    }
  }

  // 2) room code (e.g. N1001). If a room is present, its building wins the
  //    room label, but an explicit longer building alias still sets context.
  const rm = lower.match(ROOM_RE);
  if (rm) {
    const prefix = rm[1].toLowerCase();
    const entry = PREFIX_TO_ID.find(([p]) => p === prefix);
    if (entry) {
      const roomBuilding = byId(entry[1]);
      const roomLabel = `${rm[1].toUpperCase()} ${rm[2]}`.replace(/\s+/g, ' ').trim();
      // Normalize codes with no space (N1001) vs spaced (BA 202)
      const normalized = /\s/.test(rm[0]) ? roomLabel : `${rm[1].toUpperCase()}${rm[2]}`;
      return { building: best?.building ?? roomBuilding, room: normalized };
    }
  }

  return best ? { building: best.building } : null;
}

function roomNote(room?: string, info?: Room): string {
  if (!room) return '';
  if (info) return ` ${info.code} is a ${info.capacity}-seat ${info.type} on floor ${info.floor}.`;
  return '';
}

// ── Routing: Dijkstra over covered connections ────────────────────────────
type Step = { to: string; kind: string; minutes: number; covered: boolean };

function shortestPath(fromId: string, toId: string): { steps: Step[]; total: number } | null {
  const adj = new Map<string, Step[]>();
  for (const c of CONNECTIONS) {
    if (!adj.has(c.a)) adj.set(c.a, []);
    if (!adj.has(c.b)) adj.set(c.b, []);
    adj.get(c.a)!.push({ to: c.b, kind: c.kind, minutes: c.minutes, covered: c.covered });
    adj.get(c.b)!.push({ to: c.a, kind: c.kind, minutes: c.minutes, covered: c.covered });
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; step: Step }>();
  dist.set(fromId, 0);
  const pq = new Set<string>([fromId]);

  while (pq.size) {
    // pop the min-distance node
    let u: string | null = null;
    let ud = Infinity;
    for (const n of pq) {
      const d = dist.get(n) ?? Infinity;
      if (d < ud) { ud = d; u = n; }
    }
    if (u === null) break;
    pq.delete(u);
    if (u === toId) break;

    for (const edge of adj.get(u) ?? []) {
      const nd = ud + edge.minutes;
      if (nd < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nd);
        prev.set(edge.to, { node: u, step: edge });
        pq.add(edge.to);
      }
    }
  }

  if (!dist.has(toId)) return null;

  const steps: Step[] = [];
  let cur = toId;
  while (cur !== fromId) {
    const p = prev.get(cur);
    if (!p) return null;
    steps.unshift(p.step);
    cur = p.node;
  }
  return { steps, total: dist.get(toId)! };
}

function walkMinutes(a: Building, b: Building): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const meters = 2 * R * Math.asin(Math.sqrt(s));
  return Math.max(1, Math.round(meters / 75)); // ~75 m/min walking pace
}

function closureFor(id: string) {
  return CLOSURES.find((c) => c.building === id);
}

// Indoor minutes between two core buildings (distance-based; halls aren't straight).
const indoorMins = (a: Building, b: Building) =>
  a.id === b.id ? 0 : Math.max(2, Math.round(walkMinutes(a, b) * 1.2));

// One endpoint inside the indoor core, the other outside → stay indoors as far
// as possible, then take the shortest outdoor hop. Picks the exit that
// minimizes total time, and reports how long you're actually exposed.
function splitRoute(inside: Building, outside: Building) {
  let best: { exit: Building; indoor: number; outdoor: number; total: number } | null = null;
  for (const exit of BUILDINGS) {
    if (!exit.connected) continue;
    if (exit.id !== inside.id && !shortestPath(inside.id, exit.id)) continue; // must be reachable indoors
    const indoor = indoorMins(inside, exit);
    const outdoor = Math.max(1, walkMinutes(exit, outside));
    const total = indoor + outdoor;
    if (!best || total < best.total) best = { exit, indoor, outdoor, total };
  }
  return best;
}

function describeRoute(from: Resolved, to: Resolved): string {
  const a = from.building;
  const b = to.building;

  if (a.id === b.id) {
    return `You're already at ${a.name}.${roomNote(to.room ?? from.room, to.roomInfo ?? from.roomInfo)} 🐥`;
  }

  let body: string;
  const adjacent = shortestPath(a.id, b.id);

  if (a.connected && b.connected) {
    // Both indoors. Name the specific link if they're directly adjacent.
    if (adjacent && adjacent.steps.length === 1) {
      body = `${a.name} → ${b.name}: ~${adjacent.steps[0].minutes} min via the ${adjacent.steps[0].kind}, indoors 🗺️`;
    } else {
      body = `${a.name} → ${b.name}: ~${indoorMins(a, b)} min, all indoors via the Concourse 🗺️`;
    }
  } else if (a.connected !== b.connected) {
    // Mixed: walk indoors to the best exit, then only the last leg outside.
    const inside = a.connected ? a : b;
    const outside = a.connected ? b : a;
    const split = splitRoute(inside, outside);
    if (!split || split.indoor === 0) {
      body = `${a.name} → ${b.name}: ~${Math.max(1, walkMinutes(a, b))} min outdoors 🚶`;
    } else if (a.connected) {
      body = `${a.name} → ${b.name}: ~${split.total} min — indoors to ${split.exit.name} (${split.indoor} min), then ${split.outdoor} min outside. Only ${split.outdoor} min exposed 🗺️`;
    } else {
      body = `${a.name} → ${b.name}: ~${split.total} min — ${split.outdoor} min outside to ${split.exit.name}, then indoors the rest (${split.indoor} min). Only ${split.outdoor} min exposed 🗺️`;
    }
  } else {
    // Both outside the core.
    body = `${a.name} → ${b.name}: ~${Math.max(1, walkMinutes(a, b))} min walk outdoors 🚶`;
  }

  const warnings = [closureFor(a.id), closureFor(b.id)]
    .filter(Boolean)
    .map((c) => `⚠️ ${c!.detail} ${c!.reroute}`);

  return [body + roomNote(to.room, to.roomInfo), ...warnings].join('\n');
}

// ── Intent: pull an origin and destination out of the message ─────────────
// Handles "from A to B", "to B from A", "A to B", "between A and B", and a
// lone "from A" or "to B". Either side may be null.
function parseRoute(text: string): { origin: string | null; dest: string | null } {
  const between = text.match(/\bbetween\s+(.+?)\s+and\s+(.+)/i);
  if (between) return { origin: between[1].trim(), dest: between[2].trim() };

  // "from <origin>" up to a following "to"/end; "to <dest>" up to a following "from"/end.
  const fromM = text.match(/\bfrom\s+(.+?)(?=\s+\bto\b|[?.!]|$)/i);
  const toM = text.match(/\bto\s+(.+?)(?=\s+\bfrom\b|[?.!]|$)/i);
  let origin = fromM ? fromM[1].trim() : null;
  const dest = toM ? toM[1].trim() : null;

  // "A to B" with no explicit "from": the text before "to" may be the origin.
  if (!origin && dest) {
    const idx = text.toLowerCase().search(/\bto\b/);
    const before = idx > 0 ? text.slice(0, idx).trim() : '';
    if (before && resolveLocation(before)) origin = before;
  }
  return { origin, dest };
}

// ── Non-route intents ─────────────────────────────────────────────────────
// True only for broad "what's open right now?" style questions — used to decide
// whether a hours question with no resolved building deserves a general summary
// or an honest "I don't know that place".
function looksGenericHoursQuery(text: string): boolean {
  const l = text.toLowerCase();
  if (/\b(things|stuff|everything|anything|places?|campus|what'?s open|whats open|what is open|open now|around)\b/.test(l)) return true;
  return l.replace(/[^a-z ]/g, ' ').trim().split(/\s+/).filter(Boolean).length <= 3;
}

function answerHours(text: string, now: number): string {
  const loc = resolveLocation(text);
  if (loc) {
    const b = loc.building;
    const open = isOpenNow(b.hours.open, b.hours.close, now);
    if (open === true) return `${b.name} is open right now until ${fmtTime(b.hours.close)} ✅`;
    if (open === false) return `${b.name} is closed right now — it opens at ${fmtTime(b.hours.open)} 🕒`;
    return `I'm not sure of ${b.name}'s hours today — check the map tab.`;
  }
  // Named a place we couldn't find → say so, don't substitute other hours.
  if (!looksGenericHoursQuery(text)) {
    return `I don't have hours for that one — I might not know that place. Ask about a specific building (like the Library, Dining Hall, or Athletic Complex) or check the map tab 🐥`;
  }
  // Generic "what's open?" → summarize a few key buildings with live status.
  const key = ['library', 'dining-hall', 'athletic-complex']
    .map((id) => BUILDINGS.find((b) => b.id === id))
    .filter((b): b is Building => !!b);
  const parts = key.map((b) => {
    const open = isOpenNow(b.hours.open, b.hours.close, now);
    const tag = open === true ? `open until ${fmtTime(b.hours.close)}` : open === false ? `closed, opens ${fmtTime(b.hours.open)}` : `${fmtTime(b.hours.open)}–${fmtTime(b.hours.close)}`;
    return `${b.name}: ${tag}`;
  });
  return `Right now — ${parts.join(' · ')} 🕒`;
}

function answerStudy(): string {
  const open = [...SPACES].filter((s) => s.fillPct < 60).sort((a, b) => a.fillPct - b.fillPct);
  const pick = open.length ? open : [...SPACES].sort((a, b) => a.fillPct - b.fillPct);
  const top = pick.slice(0, 2).map((s) => `${s.name} (${s.fillPct}% full, ${s.type})`);
  return `Good spots right now: ${top.join(' and ')} 📚`;
}

function answerFood(now: number): string {
  const dining = BUILDINGS.find((b) => b.id === 'dining-hall');
  const tag = dining
    ? (isOpenNow(dining.hours.open, dining.hours.close, now) ? `open until ${fmtTime(dining.hours.close)}` : `opens ${fmtTime(dining.hours.open)}`)
    : 'on campus';
  return `Dining Hall (${tag}) has a rotating menu. Byte Café and Wilf's Restaurant are also on campus 🍽️`;
}

function answerEvents(): string {
  const list = EVENTS.slice(0, 3).map((e) => `${e.title} — ${e.location}, ${e.when}`);
  return `Coming up: ${list.join(' · ')} 🎉`;
}

function answerGeese(): string {
  if (!GEESE.length) return 'No goose sightings reported right now 🪿';
  const worst = GEESE.find((g) => g.severity === 'aggressive') || GEESE[0];
  return `⚠️ ${worst.severity} geese reported ${worst.note}. Give them space and use a side entrance 🪿`;
}

function answerAccessible(text: string): string {
  const loc = resolveLocation(text);
  if (loc?.building.accessible) return `${loc.building.name}: ${loc.building.accessible} ♿`;
  if (loc) return `I don't have a verified accessible-entrance note for ${loc.building.name} yet — use the Accessible filter on the map or contact Accessible Learning ♿`;
  return `The core academic buildings link step-free through the Concourse. For specific accessible entrances and elevators, use the Accessible filter on the map or contact Accessible Learning ♿`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusPhrase(b: Building, now: number): string {
  if (b.hours.open === b.hours.close) return 'card access only';
  const open = isOpenNow(b.hours.open, b.hours.close, now);
  return open === true
    ? `open now until ${fmtTime(b.hours.close)}`
    : open === false
      ? `closed now (opens ${fmtTime(b.hours.open)})`
      : `${fmtTime(b.hours.open)}–${fmtTime(b.hours.close)}`;
}

// "what's in X" / "where is X" / "what street is X on" → building profile.
function answerInfo(loc: Resolved, now: number): string {
  const b = loc.building;
  const where = b.connected
    ? 'part of the indoor Concourse-connected core'
    : 'a short outdoor walk from the core';
  const code = b.code ? ` (${b.code})` : '';
  return `${b.name}${code} — ${b.street}. ${cap(b.contains)}. ${cap(statusPhrase(b, now))}; ${where}.${roomNote(loc.room, loc.roomInfo)} Ask me for a route and I'll map it 🐥`;
}

// A specific known classroom → capacity, type, floor, building.
function answerRoom(loc: Resolved, now: number): string {
  const r = loc.roomInfo!;
  const b = loc.building;
  const where = b.connected ? 'the indoor Concourse-connected core' : 'a short outdoor walk from the core';
  const code = b.code ? ` (${b.code})` : '';
  return `${r.code} is a ${r.capacity}-seat ${r.type} on floor ${r.floor} of ${b.name}${code} — ${b.street}. ${cap(statusPhrase(b, now))}; ${where}. Ask me for a route and I'll map it 🐥`;
}

// "what's on the 4th floor of Bricker?" → floor directory (where we have one).
function answerFloor(text: string): string | null {
  const loc = resolveLocation(text);
  if (!loc) return null;
  const floors = FLOORS[loc.building.id];
  let fl: number | null = null;
  const m = text.match(/\b(\d+)\s*(?:st|nd|rd|th)?\s*floor\b/i) || text.match(/\bfloor\s*(\d+)\b/i);
  if (m) fl = parseInt(m[1], 10);
  else if (/\b(ground|main|first)\s*floor\b/i.test(text)) fl = 1;
  if (!floors) {
    return `I don't have a floor-by-floor list for ${loc.building.name} yet (I do for Bricker Academic). ${cap(loc.building.contains)}.`;
  }
  if (fl == null) {
    return `${loc.building.name}, floor by floor — ${floors.map((f) => `${f.floor}) ${f.has}`).join('; ')} 🏫`;
  }
  const hit = floors.find((f) => f.floor === fl);
  return hit
    ? `Floor ${fl} of ${loc.building.name} has ${hit.has} 🏫`
    : `I don't have anything listed for floor ${fl} of ${loc.building.name}.`;
}

// "which building has Political Science?" / "where's the Registrar?"
function answerDirectory(text: string): string | null {
  const l = text.toLowerCase();
  const hits = DIRECTORY.filter((d) => l.includes(d.term)).sort((a, b) => b.term.length - a.term.length);
  if (!hits.length) return null;
  const d = hits[0];
  const b = byId(d.building);
  return `${cap(d.term)} is in ${b.name}${b.code ? ` (${b.code})` : ''}${d.note ? `, ${d.note}` : ''} — ${b.street}. Ask me for a route and I'll map it 🐥`;
}

// When a student gives only a destination ("how do I get to BA 202"), route
// from the Concourse (central campus) and state the assumption.
const CONCOURSE_ID = 'fred-nichols-campus-centre';
function routeFromDefault(dest: Resolved, now: number): string {
  if (dest.building.id === CONCOURSE_ID) {
    return `The ${dest.building.name} (the Concourse) is central campus — ${statusPhrase(dest.building, now)}.${roomNote(dest.room, dest.roomInfo)} Tell me where you're coming from and I'll route you 🗺️`;
  }
  const origin = BUILDINGS.find((b) => b.id === CONCOURSE_ID);
  if (!origin) return answerInfo(dest, now);
  return `From the Concourse (central campus) — tell me if you're starting elsewhere:\n${describeRoute({ building: origin }, dest)}`;
}

// ── Main entry point ──────────────────────────────────────────────────────
export function answerLocally(message: string): string {
  const text = message.trim();
  const lower = text.toLowerCase();
  const now = nowMinutes();

  // Route intent: pull origin/destination from the message.
  const route = parseRoute(text);
  const routeWords = /\b(route|directions?|navigate|shortest|fastest|how (do|can) i get|way to|get to|walk to)\b/i.test(text);
  const from = route.origin ? resolveLocation(route.origin) : null;
  const to = route.dest ? resolveLocation(route.dest) : null;

  if (from && to) return describeRoute(from, to);

  // Real origin given, destination not found (or missing).
  if (from && !to) {
    if (route.dest) return `I know ${from.building.name}, but I couldn't place "${route.dest}" — try a building name or room code like "BA 202" or "N1001" 🗺️`;
    return `Where do you want to go from ${from.building.name}? Give me a building or room and I'll route you 🗺️`;
  }
  // Destination found, no resolvable origin → route from the Concourse default,
  // but if the student named a start we couldn't place, say so honestly.
  if (to && !from) {
    if (route.origin) return `I can get you to ${to.building.name}, but I couldn't place "${route.origin}" as a starting point — try a building name or code 🗺️`;
    return routeFromDefault(to, now);
  }
  // Nothing resolved yet, but the phrasing is clearly about routing.
  if (routeWords) {
    const dest = resolveLocation(text);
    if (dest) return routeFromDefault(dest, now);
    return `Where do you want to go? Give me a building or room — e.g. "how do I get to BA 202" 🗺️`;
  }

  // "how big is N1001?" / "capacity of LH1001" / "what kind of room is BA 202"
  if (/\b(how (big|many|large)|capacity|seats?|holds?|what (kind|type) of room)\b/i.test(text)) {
    const r = resolveLocation(text);
    if (r?.roomInfo) return answerRoom(r, now);
  }

  // "what's on the 4th floor of Bricker?" / "bricker floors" / "what floor is biology on"
  if (/\bfloors?\b/i.test(text)) {
    const a = answerFloor(text);
    if (a) return a;
    const d = answerDirectory(text); // e.g. "what floor is biology on" → Bricker, 4th floor
    if (d) return d;
  }

  // "which building has Political Science?" / "where's the Registrar's office?"
  if (/\bwhich building\b|\bwho('?s| is) in\b|\bwhere can i find\b|\bwhere.*(department|faculty|office|centre|center)\b/i.test(text)) {
    const d = answerDirectory(text);
    if (d) return d;
  }

  if (/\b(hours?|open|close[ds]?|when.*(open|close))\b/.test(lower)) return answerHours(text, now);
  if (/\b(study|quiet|seat|work|desk|spot to)\b/.test(lower)) return answerStudy();
  if (/\b(food|eat|eating|dining|caf[eé]|hungry|menu|lunch|dinner|breakfast|brunch|snacks?|coffee|restaurants?|bite)\b/.test(lower)) return answerFood(now);
  if (/\b(events?|clubs?|happening|this week|weekend|going on|workshops?|social)\b/.test(lower) || /activit|things?\s+to\s+do/.test(lower)) return answerEvents();
  if (/\b(goose|geese)\b/.test(lower)) return answerGeese();
  if (/\b(accessible|wheelchair|elevator|ramp|mobility|barrier)\b/.test(lower)) return answerAccessible(text);

  // "what's in X" / "where is X" / "what street" / "address of X" → profile.
  const isLocationQuestion =
    /\b(what('?s| is)?\s+(in|inside|at|near)|where('?s| is)?|what street|which street|address|located|which building|tell me about)\b/i.test(text);
  if (isLocationQuestion) {
    const info = resolveLocation(text);
    if (info) return info.roomInfo ? answerRoom(info, now) : answerInfo(info, now);
    // Not a building/room — maybe a department or service?
    const dir = answerDirectory(text);
    if (dir) return dir;
    // Asked where something is, but it's not in our data — be honest.
    return `I don't have that place in my campus info — it might be off-campus, or just something I don't know. Try the map tab, or ask about a building like the Science Building or the Library 🐥`;
  }

  // A bare building/room mention with no other intent → profile.
  const loc = resolveLocation(text);
  if (loc) {
    return loc.roomInfo ? answerRoom(loc, now) : answerInfo(loc, now);
  }

  // Greeting / empty → friendly intro. A real question we couldn't handle → say so.
  if (!text || /^(hi|hey+|hello|yo|sup|hiya|good (morning|afternoon|evening)|thanks|thank you|thx|ty)\b/i.test(text)) {
    return "Hey! I'm GoldenHawk 🐥 — I can help with indoor routes, building hours, study spaces, events, goose alerts, and accessible entrances. Try \"route from N1001 to DAWB\" or \"is the library open?\"";
  }
  return "I don't know that one — it's outside what I have for Laurier's Waterloo campus. I can help with indoor routes, building hours, study spaces, events, goose alerts, and accessible entrances though 🐥";
}
