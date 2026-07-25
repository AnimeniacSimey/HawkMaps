/**
 * Exports the app's campus dataset (src/data/campus.ts) to backend/campus.json,
 * so the backend LLM path shares the SAME buildings, nicknames, rooms, floors
 * and departments as the on-device engine.
 *
 * Run after editing campus.ts:
 *   npx tsx --tsconfig tsconfig.json scripts/export-campus.ts
 */
import { writeFileSync } from 'fs';
import { BUILDINGS, ROOMS, FLOORS, DIRECTORY, CONNECTIONS } from '../src/data/campus';

const nm = Object.fromEntries(BUILDINGS.map((b) => [b.id, b.name]));

const out = {
  buildings: BUILDINGS.map((b) => ({
    name: b.name, code: b.code || '', aliases: b.aliases, roomPrefixes: b.roomPrefixes,
    street: b.street, open: b.hours.open, close: b.hours.close,
    contains: b.contains, connected: b.connected, lat: b.lat, lng: b.lng,
  })),
  rooms: ROOMS.map((r) => ({ code: r.code, building: nm[r.building], floor: r.floor, capacity: r.capacity, type: r.type })),
  floors: Object.fromEntries(Object.entries(FLOORS).map(([id, fs]) => [nm[id], fs])),
  directory: DIRECTORY.map((d) => ({ term: d.term, building: nm[d.building], note: d.note || '' })),
  connections: CONNECTIONS.map((c) => ({ a: nm[c.a], b: nm[c.b], minutes: c.minutes, kind: c.kind })),
};

writeFileSync('backend/campus.json', JSON.stringify(out));
console.log(`Wrote backend/campus.json — ${out.buildings.length} buildings, ${out.rooms.length} rooms`);
