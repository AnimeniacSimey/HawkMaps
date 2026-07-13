# HawkMaps — CP317 · Wilfrid Laurier University

A campus companion app for Laurier students built with **Expo** (Expo Go compatible), **React Native**, and a **Python / FastAPI** backend.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo Go development server
npx expo start

# Scan the QR code in Expo Go on your phone, or press:
#   i  → iOS simulator
#   a  → Android emulator
#   w  → web browser
```

> **Expo Go compatible** — no custom dev client or native build required.  
> The map uses a `WebView` + Leaflet so it works out of the box.

---

## Project Structure

```
src/
├── app/                    ← Expo Router screens
│   ├── _layout.tsx         ← Root layout — auth guards (signed in vs out)
│   ├── welcome.tsx         ← 🦅 Landing screen (logo → arrow → sign in)
│   ├── login.tsx           ← 🔑 Sign in (Laurier email required)
│   ├── signup.tsx          ← ✍️ Create account
│   └── (tabs)/             ← Main app — only reachable when signed in
│       ├── _layout.tsx     ← Tab navigator — ADD NEW TABS HERE
│       ├── index.tsx       ← 📍 Map tab (home)
│       ├── events.tsx      ← 📅 Events tab
│       ├── study.tsx       ← 📚 Study spaces tab
│       └── ai.tsx          ← 🐥 GoldenHawk AI tab
│
├── components/
│   ├── map/                ← Map-specific components
│   │   ├── CampusMap.tsx         ← Leaflet WebView wrapper
│   │   ├── MapFilterChips.tsx    ← Layer toggle bar
│   │   └── LocationInfoCard.tsx  ← Slide-up detail card
│   ├── themed-text.tsx     ← Dark/light mode Text
│   ├── themed-view.tsx     ← Dark/light mode View
│   └── ui/collapsible.tsx  ← Reusable collapsible
│
├── constants/
│   └── theme.ts            ← BRAND colours, STATUS_COLORS, Spacing
│
├── hooks/
│   └── use-auth.tsx        ← 🔑 Auth context (signIn / signUp / signOut)
│
└── data/
    └── locations.ts        ← ⭐ ALL map pin data lives here

backend/
├── main.py                 ← FastAPI backend (routes + campus data)
├── goldenhawk.py           ← 🐥 GoldenHawk AI brain (Claude / Groq + fallback)
├── requirements.txt        ← Python dependencies
└── .env.example            ← copy to .env, add your AI key
```

---

## How to Add a New Map Pin

Edit **`src/data/locations.ts`** only — everything else updates automatically.

```ts
// 1. (Optional) add a new type to MapLocationType if needed
export type MapLocationType =
  | 'building' | 'study' | 'food' | 'event'
  | 'goose' | 'closure' | 'accessible' | 'shortcut'
  | 'your-new-type';   // ← add here

// 2. (Optional) add display config for the new type
export const MAP_LAYER_CONFIG = {
  // ... existing types ...
  'your-new-type': {
    label:          'Your Label',   // filter chip text
    emoji:          '🎯',           // popup icon
    color:          '#3c87f7',      // marker circle colour
    defaultVisible: true,
  },
};

// 3. Add the location object
export const locations: MapLocation[] = [
  // ... existing locations ...
  {
    id:          99,               // unique integer
    name:        'My New Spot',
    latitude:    43.4732,
    longitude:   -80.5278,
    type:        'your-new-type',
    description: 'Optional detail shown in the popup.',
    hours:       'Mon–Fri 9 AM – 5 PM',  // optional
    accessible:  true,                    // optional ♿ badge
  },
];
```

The filter chip, map marker, and info card all appear automatically.

---

## How to Add a New Screen / Tab

1. Create `src/app/your-screen.tsx` — export a default React component.
2. Add a `<Tabs.Screen>` entry in `src/app/_layout.tsx`:

```tsx
<Tabs.Screen
  name="your-screen"
  options={{
    title: 'Your Label',
    tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} />,
  }}
/>
```

That's it — Expo Router handles the routing automatically.

---

## Backend (Python / FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then point the app at your backend by creating a `.env` file in the **project
root** (Expo auto-loads `EXPO_PUBLIC_*` vars):

```bash
# .env  (project root)
EXPO_PUBLIC_API_BASE=http://192.168.1.42:8000   # your machine's LAN IP
```

> Use your LAN IP, not `localhost` — physical devices can't reach localhost on your computer.

### Sign in / Create account 🔑

The app opens on a welcome screen → sign in → the Map home tab. Accounts
require a Laurier email (`@mylaurier.ca` or `@wlu.ca`); anything else is
rejected on both the frontend and the backend.

- **With the backend running** — create an account on the signup screen, or
  use the seeded demo accounts:
  | Email | Password | Role |
  |-------|----------|------|
  | `demo@mylaurier.ca` | `hawkmaps` | student |
  | `exec@mylaurier.ca` | `hawkmaps` | club exec (CS Club) |
- **Without a backend** (no `EXPO_PUBLIC_API_BASE` set) — auth runs in local
  demo mode: any Laurier email signs in, so the app still works in Expo Go.
  Emails containing `exec` (e.g. `myexec@mylaurier.ca`) sign in as a CS Club
  exec so the exec-only UI is testable offline.

### Account designations 🎓

There are two account designations:

1. **Regular user (student)** — everyone who signs up. Browses the map,
   events, study spaces, and GoldenHawk.
2. **Club executive** — everything a student can do, **plus** a `+ Create`
   button on the Events page that posts events for **their own club only**
   (the backend forces the event's club to the exec's club).

To become a club exec you apply through the Google Form linked top-left on
the Events page ("📝 Become a club exec"). The form URL is still TBD — paste
it into `CLUB_EXEC_FORM_URL` in
[`src/app/(tabs)/events.tsx`](<src/app/(tabs)/events.tsx>) when the club
creates it; until then the button shows a "coming soon" notice. Exec status
is then granted manually (set `role`/`club` on the user in
[`backend/main.py`](backend/main.py) — no self-serve upgrade).

Auth state lives in [`src/hooks/use-auth.tsx`](src/hooks/use-auth.tsx); the
route guards live in [`src/app/_layout.tsx`](src/app/_layout.tsx)
(Expo Router `Stack.Protected`). Passwords are stored in-memory and unhashed —
demo only. TODO: real database + hashing, then Laurier Microsoft Entra SSO.

### GoldenHawk AI 🐥

The GoldenHawk chat tab talks to a real LLM. It supports two providers — add
**one** key to `backend/.env`:

```bash
cd backend
cp .env.example .env        # then paste ONE key
# GROQ_API_KEY=gsk_...       ← free, no credit card  (console.groq.com/keys)
# ANTHROPIC_API_KEY=sk-ant-... ← Claude (console.anthropic.com)
```

- **Groq** — free, no card. Get a key at [console.groq.com/keys](https://console.groq.com/keys).
- **Claude** — get a key at [console.anthropic.com](https://console.anthropic.com).

If both keys are set, Claude is used. Without any key, GoldenHawk still answers
using built-in keyword fallback replies, so the chat tab works offline. Live
campus data (buildings, hours, indoor routes, lecture halls, study-space
availability, events, closures, goose sightings) is injected as context on
every request — including the **current Waterloo time and a live open/closed
status** for each building, so GoldenHawk can say whether a place is open right
now rather than just reciting hours — see
[`backend/goldenhawk.py`](backend/goldenhawk.py).

The chat UI ([`src/app/ai.tsx`](src/app/ai.tsx)) adds tappable starter prompts,
a word-by-word typewriter reveal, and — when a reply comes from the offline
keyword fallback instead of the live model — an honest "Offline" badge with a
**Retry** button to re-attempt the real AI.

### Available Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account (Laurier email required) |
| POST | `/api/auth/login` | Email + password login |
| GET  | `/api/auth/sso`   | Microsoft SSO redirect |
| GET  | `/api/auth/me`    | Current user (auth required) |
| GET  | `/api/events`     | List events (optional `?search=`, `?tag=`) |
| POST | `/api/events`     | Create event (club execs only — always for their own club) |
| GET  | `/api/events/{id}` | Single event by id |
| GET  | `/api/spaces`     | Study space availability |
| GET  | `/api/buildings`  | Campus buildings list |
| GET  | `/api/buildings/{id}/hours` | Today's hours for a building |
| GET  | `/api/goose`      | Goose sighting reports |
| POST | `/api/goose`      | Submit goose sighting (auth required) |
| GET  | `/api/indoor-routes` | Indoor/covered routes between buildings (powers GoldenHawk) |
| GET  | `/api/lecture-halls` | Lecture hall → building map |
| GET  | `/api/closures`   | Active campus closures |
| GET  | `/api/reviews`    | Reviews (optional `?target_id=`, `?target_type=`) |
| POST | `/api/reviews`    | Submit review (auth required) |
| POST | `/api/ai/chat`    | GoldenHawk AI chat (Claude / Groq, campus data injected) |
| GET  | `/api/health`     | Health check + AI connection status |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.85, Expo 56, Expo Router |
| Map | Leaflet 1.9 via react-native-webview (Expo Go compatible) |
| Backend | Python 3.11, FastAPI, uvicorn |
| Auth (planned) | Laurier Microsoft Entra SSO (OAuth2 PKCE) |

---

## Team — CP317

- Owen · Ali · Tejas · Simon · Stephan · Marie
