"""
Hawk Maps — FastAPI Backend
CP317 · Wilfrid Laurier University

Run:
    pip install fastapi uvicorn python-jose[cryptography] passlib bcrypt python-dotenv
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os

try:
    from zoneinfo import ZoneInfo
    CAMPUS_TZ = ZoneInfo("America/Toronto")  # Waterloo campus timezone
except Exception:  # pragma: no cover - tzdata missing; fall back to server local time
    CAMPUS_TZ = None

import goldenhawk
import json
import pathlib

# Full campus dataset, exported from the app's src/data/campus.ts so the LIVE
# (LLM) path shares the SAME 65 buildings, nicknames, rooms, floors and
# departments the on-device engine uses. Regenerate campus.json when campus.ts
# changes (see scripts/export-campus). This is what fixes "willy"/"mac" etc.
try:
    with open(pathlib.Path(__file__).parent / "campus.json", encoding="utf-8") as _cf:
        CAMPUS = json.load(_cf)
except Exception:  # pragma: no cover
    CAMPUS = {"buildings": [], "rooms": [], "floors": {}, "directory": [], "connections": []}

app = FastAPI(title="Hawk Maps API", version="0.1.0")

# ── CORS (allow React dev server) ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev/testing: allow the LAN web build + Expo Go
    allow_credentials=False,      # no cookies are used, so "*" origins is fine
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth helpers (stubbed — wire to Laurier SSO / Microsoft Entra) ────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=8)):
    """Return a signed JWT. Replace with real jose.jwt.encode in production."""
    return f"demo_token_{data.get('sub', 'user')}"

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validate JWT. Replace with real jose.jwt.decode in production."""
    if not token.startswith("demo_token_"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return {"username": token.replace("demo_token_", ""), "email": f"{token}@mylaurier.ca"}

# ── Models ────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

class EventCreate(BaseModel):
    title: str
    description: str
    location: str
    start_time: str
    end_time: str
    club: Optional[str] = None

class ReviewCreate(BaseModel):
    target_id: str
    target_type: str  # "course" | "professor" | "restaurant" | "space"
    rating: int       # 1–5
    body: str

class GooseReport(BaseModel):
    lat: float
    lng: float
    severity: str  # "mild" | "aggressive"
    note: Optional[str] = None

# ── Auth Routes ───────────────────────────────────────────────────────────
@app.post("/api/auth/login")
def login(req: LoginRequest):
    """
    Authenticate with Laurier email + password.
    TODO: Replace stub with Laurier Microsoft Entra SSO (OAuth2 PKCE flow).
    """
    if not req.email.endswith("@mylaurier.ca") and not req.email.endswith("@wlu.ca"):
        raise HTTPException(status_code=400, detail="Must use a Laurier email address")
    token = create_access_token({"sub": req.email.split("@")[0]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/sso")
def sso_redirect():
    """Redirect to Microsoft OAuth — replace URL with your Azure App Registration."""
    sso_url = os.getenv("MICROSOFT_SSO_URL", "https://login.microsoftonline.com/YOUR_TENANT/oauth2/v2.0/authorize")
    return {"redirect_url": sso_url}

@app.get("/api/auth/me")
def get_me(user=Depends(get_current_user)):
    return {"username": user["username"], "email": user["email"]}

# ── Events Routes ─────────────────────────────────────────────────────────
EVENTS_DB: list[dict] = [
    {"id": 1, "title": "CS Club Hackathon",  "location": "BA 202",         "start": "2024-11-08T09:00", "club": "CS Club",     "tags": ["Tech"]},
    {"id": 2, "title": "Open Mic Night",     "location": "Turret Lounge",  "start": "2024-11-09T19:00", "club": "Music Club",  "tags": ["Social"]},
    {"id": 3, "title": "Eco Club Fair",      "location": "Concourse",      "start": "2024-11-10T11:00", "club": "Eco Club",    "tags": ["Environment"]},
    {"id": 4, "title": "Intramural Finals",  "location": "AC Gym",         "start": "2024-11-11T14:00", "club": "Athletics",   "tags": ["Sports"]},
    {"id": 5, "title": "Career Fair 2024",   "location": "Athletic Complex","start": "2024-11-15T10:00","club": None,          "tags": ["Career", "Free"]},
]

@app.get("/api/events")
def list_events(search: Optional[str] = None, tag: Optional[str] = None):
    results = EVENTS_DB
    if search:
        results = [e for e in results if search.lower() in e["title"].lower()]
    if tag:
        results = [e for e in results if tag in e.get("tags", [])]
    return results

@app.post("/api/events", status_code=201)
def create_event(ev: EventCreate, user=Depends(get_current_user)):
    """Club executives can POST new events."""
    new_ev = {"id": len(EVENTS_DB) + 1, **ev.dict(), "created_by": user["username"], "created_at": datetime.utcnow().isoformat()}
    EVENTS_DB.append(new_ev)
    return new_ev

@app.get("/api/events/{event_id}")
def get_event(event_id: int):
    ev = next((e for e in EVENTS_DB if e["id"] == event_id), None)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev

# ── Study Spaces Routes ───────────────────────────────────────────────────
SPACES_DB = [
    {"id": 1, "name": "Peters Library — 2nd Floor",   "seats": 36,  "fill_pct": 40, "type": "quiet",        "building": "Peters Library"},
    {"id": 2, "name": "BA Building — Study Room 3",   "seats": 8,   "fill_pct": 72, "type": "collaborative", "building": "BA Building"},
    {"id": 3, "name": "Byte Café Seating Area",        "seats": 24,  "fill_pct": 95, "type": "casual",        "building": "Student Centre"},
    {"id": 4, "name": "Lazaridis Hall — Atrium",      "seats": 50,  "fill_pct": 25, "type": "open",          "building": "Lazaridis Hall"},
    {"id": 5, "name": "Science Building — Lab Wing",  "seats": 20,  "fill_pct": 60, "type": "computer",      "building": "Science Building"},
]

def fill_to_status(pct: int) -> str:
    if pct < 60: return "open"
    if pct < 90: return "busy"
    return "full"

def _to_minutes(hhmm: str) -> Optional[int]:
    """'08:30' -> 510. Returns None if unparseable."""
    try:
        h, m = hhmm.split(":")
        return int(h) * 60 + int(m)
    except (ValueError, AttributeError):
        return None

def is_open_now(open_str: str, close_str: str, now_minutes: int) -> Optional[bool]:
    """Whether a place is open at now_minutes (minutes past midnight).

    Handles overnight hours where close is past midnight (e.g. open 08:00,
    close 00:00 means open until midnight; open 20:00 close 02:00 crosses over).
    Returns None if the hours can't be parsed.
    """
    o, c = _to_minutes(open_str), _to_minutes(close_str)
    if o is None or c is None or o == c:
        return None
    if c > o:                       # same-day hours
        return o <= now_minutes < c
    return now_minutes >= o or now_minutes < c  # crosses midnight

@app.get("/api/spaces")
def list_spaces(type: Optional[str] = None):
    spaces = [{"status": fill_to_status(s["fill_pct"]), **s} for s in SPACES_DB]
    if type:
        spaces = [s for s in spaces if s["type"] == type]
    return spaces

# ── Campus Map / Buildings ────────────────────────────────────────────────
# Wilfrid Laurier University — Waterloo campus. Names, codes and COORDINATES from
# Laurier's official Concept3D campus map (map.concept3d.com id=638); hours from
# wlu.ca's building-hours schedule (verified July 2026). The full 65-building set
# and indoor-route graph live in the app at src/data/campus.ts; this is the core
# subset the LLM reasons over. "connected" marks the indoor Concourse-linked core.
_ACC = "Accessible entrance available — see Laurier's accessibility map"
BUILDINGS_DB = [
    {"id":1,  "name":"Science Building",                "code":"N",    "street":"75 University Ave W", "connected":True,  "lat":43.47355,"lng":-80.5248,  "contains":"Faculty of Science labs and lecture halls; atrium study space", "accessible_entrance":_ACC},
    {"id":2,  "name":"Bricker Academic Building",       "code":"BA",   "street":"75 University Ave W", "connected":True,  "lat":43.47282,"lng":-80.52648, "contains":"Laurier's largest lecture halls (450 + two 200 seat) and Media Technology Services; connects directly to the Science Building", "accessible_entrance":_ACC},
    {"id":3,  "name":"Frank C. Peters Building",        "code":"P",    "street":"75 University Ave W", "connected":True,  "lat":43.47364,"lng":-80.5306,  "contains":"classrooms and study rooms; connected to the Library", "accessible_entrance":_ACC},
    {"id":4,  "name":"Dining Hall (Paul Martin Centre)","code":"DH",   "street":"75 University Ave W", "connected":True,  "lat":43.47437,"lng":-80.52872, "contains":"the Fresh Food Company dining hall", "accessible_entrance":_ACC},
    {"id":5,  "name":"Lazaridis Hall",                  "code":"LH",   "street":"64 University Ave W (across University Ave)", "connected":False, "lat":43.47506,"lng":-80.52949, "contains":"the Lazaridis School of Business & Economics; large lecture halls and atrium study", "accessible_entrance":_ACC},
    {"id":6,  "name":"Athletic Complex",               "code":"AC",   "street":"Seagram Dr / University Stadium", "connected":False, "lat":43.47526,"lng":-80.5255,  "contains":"gym, pool, fitness centre and varsity athletics", "accessible_entrance":_ACC},
    {"id":7,  "name":"Dr. Alvin Woods Building",       "code":"DAWB", "street":"75 University Ave W", "connected":True,  "lat":43.47339,"lng":-80.5294,  "contains":"classrooms and quiet study rooms on floors 3-5", "accessible_entrance":_ACC},
    {"id":8,  "name":"Arts Building",                  "code":"C/E",  "street":"75 University Ave W", "connected":True,  "lat":43.4738, "lng":-80.52931, "contains":"Faculty of Arts lecture theatres; the Concourse and Solarium are at the Arts E end", "accessible_entrance":_ACC},
    {"id":9,  "name":"Fred Nichols Campus Centre",     "code":"FNCC", "street":"75 University Ave W", "connected":True,  "lat":43.4737, "lng":-80.52868, "contains":"the Concourse, 24-Hour Lounge, Solarium, Turret, Wilf's, food and the Students' Union", "accessible_entrance":_ACC},
    {"id":10, "name":"Laurier Library",                "code":"L",    "street":"75 University Ave W", "connected":True,  "lat":43.47296,"lng":-80.52997, "contains":"computer labs, group study rooms and a café; open 24h during exams", "accessible_entrance":_ACC},
    {"id":11, "name":"Schlegel Building",              "code":"SB",   "street":"75 University Ave W", "connected":True,  "lat":43.47342,"lng":-80.53031, "contains":"the Schlegel Centre for Entrepreneurship & Social Innovation; atrium study", "accessible_entrance":_ACC},
    {"id":12, "name":"Savvas Chamberlain Music Building","code":"M",  "street":"75 University Ave W", "connected":True,  "lat":43.47473,"lng":-80.52784, "contains":"the Faculty of Music, practice studios and study rooms", "accessible_entrance":_ACC},
]

# Building hours by id. Academic buildings are open 7am-11pm daily per wlu.ca;
# Library/Dining/Athletics vary. TODO: pull live from Laurier's data source.
BUILDING_HOURS = {
    1:  {"open": "07:00", "close": "23:00"},
    2:  {"open": "07:00", "close": "23:00"},
    3:  {"open": "07:00", "close": "23:00"},
    4:  {"open": "07:00", "close": "23:00"},
    5:  {"open": "07:00", "close": "23:00"},
    6:  {"open": "06:00", "close": "23:00"},
    7:  {"open": "07:00", "close": "23:00"},
    8:  {"open": "07:00", "close": "23:00"},
    9:  {"open": "07:00", "close": "23:00"},
    10: {"open": "08:00", "close": "00:00"},
    11: {"open": "07:00", "close": "23:00"},
    12: {"open": "07:00", "close": "23:00"},
}

@app.get("/api/buildings")
def list_buildings():
    return BUILDINGS_DB

@app.get("/api/buildings/{building_id}/hours")
def building_hours(building_id: int):
    """Returns today's hours. TODO: pull from live Laurier data source."""
    return BUILDING_HOURS.get(building_id, {"open": "N/A", "close": "N/A"})

# ── Goose Sightings ───────────────────────────────────────────────────────
GOOSE_DB: list[dict] = [
    {"id":1, "lat":43.4735,"lng":-80.5260, "severity":"aggressive", "note":"Near Alumni Hall", "reported_at":"2024-11-08T08:30"},
    {"id":2, "lat":43.4730,"lng":-80.5270, "severity":"mild",       "note":"By library entrance", "reported_at":"2024-11-08T09:10"},
]

@app.get("/api/goose")
def list_goose_reports():
    return GOOSE_DB

@app.post("/api/goose", status_code=201)
def report_goose(report: GooseReport, user=Depends(get_current_user)):
    new_r = {"id": len(GOOSE_DB)+1, **report.dict(), "reported_by": user["username"], "reported_at": datetime.utcnow().isoformat()}
    GOOSE_DB.append(new_r)
    return new_r

# ── Indoor routes, lecture halls & closures (powers GoldenHawk AI-01) ──────
# Indoor / covered connections between buildings — the data GoldenHawk needs to
# suggest the fastest *indoor* route and keep students out of the rain.
# The core academic buildings are linked indoors through the CONCOURSE (at Arts
# E / Fred Nichols Campus Centre). We model that hub: each core building connects
# to the Concourse (Fred Nichols). Lazaridis Hall (across University Ave), the
# Athletic Complex and residences are OUTDOOR walks — no indoor connection.
# Times are estimates; Laurier publishes no official tunnel map.
INDOOR_CONNECTIONS = [
    {"id": 1, "from": "Arts Building",             "to": "Fred Nichols Campus Centre", "type": "indoor link through the Concourse", "minutes": 1, "covered": True, "note": "The Concourse sits at the Arts E end."},
    {"id": 2, "from": "Bricker Academic Building", "to": "Science Building",            "type": "indoor link", "minutes": 2, "covered": True, "note": "Bricker Academic connects directly to the Science Building."},
    {"id": 3, "from": "Bricker Academic Building", "to": "Fred Nichols Campus Centre", "type": "indoor link through the Concourse", "minutes": 2, "covered": True, "note": "Bricker links toward the Concourse."},
    {"id": 4, "from": "Dr. Alvin Woods Building",  "to": "Arts Building",               "type": "indoor link", "minutes": 1, "covered": True, "note": "Indoors between Arts and the Dr. Alvin Woods wing."},
    {"id": 5, "from": "Dr. Alvin Woods Building",  "to": "Schlegel Building",           "type": "indoor link", "minutes": 1, "covered": True, "note": "Indoors between DAWB and Schlegel."},
    {"id": 6, "from": "Schlegel Building",         "to": "Frank C. Peters Building",    "type": "indoor link", "minutes": 1, "covered": True, "note": "Peters and Schlegel connect indoors."},
    {"id": 7, "from": "Frank C. Peters Building",  "to": "Laurier Library",             "type": "indoor link", "minutes": 1, "covered": True, "note": "The Library connects directly to the Peters Building."},
    {"id": 8, "from": "Dining Hall (Paul Martin Centre)", "to": "Fred Nichols Campus Centre", "type": "indoor link", "minutes": 1, "covered": True, "note": "Straight through to the Dining Hall."},
    {"id": 9, "from": "Savvas Chamberlain Music Building", "to": "Dining Hall (Paul Martin Centre)", "type": "indoor link", "minutes": 1, "covered": True, "note": "Indoors toward the Music Building."},
]

# Where notable lecture halls / classrooms live, so GoldenHawk can resolve a
# student's "my lecture hall" to a building and route them there.
LECTURE_HALLS = [
    {"room": "BA 202",        "building": "Bricker Academic Building",  "note": "Large lecture theatre in Bricker Academic."},
    {"room": "N1001",         "building": "Science Building",           "note": "Ground-floor Science Building lecture hall."},
    {"room": "DAWB 2-101",    "building": "Dr. Alvin Woods Building",   "note": "Second-floor lecture room."},
    {"room": "LH 1002",       "building": "Lazaridis Hall",             "note": "Lecture hall in Lazaridis Hall (across University Ave)."},
    {"room": "P2027",         "building": "Frank C. Peters Building",   "note": "Classroom in the Peters Building."},
]

# Temporary closures / construction the AI should route around.
CLOSURES_DB: list[dict] = []

@app.get("/api/indoor-routes")
def list_indoor_routes():
    return INDOOR_CONNECTIONS

@app.get("/api/lecture-halls")
def list_lecture_halls():
    return LECTURE_HALLS

@app.get("/api/closures")
def list_closures():
    return CLOSURES_DB

# ── Reviews ───────────────────────────────────────────────────────────────
REVIEWS_DB: list[dict] = []

@app.get("/api/reviews")
def list_reviews(target_id: Optional[str] = None, target_type: Optional[str] = None):
    results = REVIEWS_DB
    if target_id:
        results = [r for r in results if r["target_id"] == target_id]
    if target_type:
        results = [r for r in results if r["target_type"] == target_type]
    return results

@app.post("/api/reviews", status_code=201)
def create_review(review: ReviewCreate, user=Depends(get_current_user)):
    if not 1 <= review.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    new_r = {"id": len(REVIEWS_DB)+1, **review.dict(), "author": user["username"], "created_at": datetime.utcnow().isoformat()}
    REVIEWS_DB.append(new_r)
    return new_r

# ── GoldenHawk AI Chat ────────────────────────────────────────────────────
def build_campus_context() -> str:
    """Serialize the FULL campus dataset (campus.json) so the LLM knows every
    building, nickname, room, floor and department the on-device engine does."""
    now = datetime.now(CAMPUS_TZ) if CAMPUS_TZ else datetime.now()
    nm = now.hour * 60 + now.minute

    lines: list[str] = ["Wilfrid Laurier University — Waterloo Campus", ""]
    lines.append(
        f'CURRENT LOCAL TIME: {now.strftime("%A, %B %-d, %Y at %-I:%M %p")} '
        f'(Waterloo, Ontario). Use this to say whether places are open RIGHT NOW.'
    )
    lines.append("")
    lines.append(
        "HOW TO READ THIS: [core] buildings are linked indoors through the Concourse; "
        "[outdoor] ones need an outdoor walk. 'aka' lists the nicknames students use — "
        "treat them as the SAME place, and only use the buildings listed below (never "
        "invent one). Nicknames are exact: 'willy' = Willison Hall (a residence, NOT "
        "Wilf's the restaurant); 'mac' = Macdonald House; 'the caf'/'caf' = Dining Hall; "
        "'laz' = Lazaridis Hall; 'the ac'/'rec centre' = Athletic Complex. Room codes: the "
        "first digit is the floor (N1001 = Science, ground floor). For a core<->outdoor "
        "trip, route indoors as far as possible then only the last leg outside, and say "
        "how many minutes are exposed."
    )
    lines.append("")

    lines.append("BUILDINGS:")
    for b in CAMPUS.get("buildings", []):
        st = is_open_now(b["open"], b["close"], nm)
        tag = (f"OPEN until {b['close']}" if st is True
               else f"CLOSED, opens {b['open']}" if st is False
               else "card access / hours vary")
        core = "[core]" if b.get("connected") else "[outdoor]"
        code = f' ({b["code"]})' if b.get("code") else ""
        aka = [a for a in b.get("aliases", []) if a.lower() != b["name"].lower()][:6]
        akatxt = f' aka {", ".join(aka)}.' if aka else ""
        lines.append(f'- {core} {b["name"]}{code} — {b["street"]}. {b["contains"]}. {tag}.{akatxt}')

    lines.append("")
    lines.append("CLASSROOMS (real bookable rooms; code — capacity, type, floor, building):")
    for r in CAMPUS.get("rooms", []):
        lines.append(f'- {r["code"]}: {r["capacity"]}-seat {r["type"]}, {r["building"]} (floor {r["floor"]})')

    if CAMPUS.get("floors"):
        lines.append("")
        lines.append("FLOOR DIRECTORY:")
        for bname, fs in CAMPUS["floors"].items():
            for f in fs:
                lines.append(f'- {bname}, floor {f["floor"]}: {f["has"]}')

    lines.append("")
    lines.append("DEPARTMENTS / FACULTIES / SERVICES -> which building:")
    for d in CAMPUS.get("directory", []):
        note = f' ({d["note"]})' if d.get("note") else ""
        lines.append(f'- {d["term"]} -> {d["building"]}{note}')

    lines.append("")
    lines.append("INDOOR CONNECTIONS (walk between these without going outside):")
    for c in CAMPUS.get("connections", []):
        lines.append(f'- {c["a"]} <-> {c["b"]} via {c["kind"]}, ~{c["minutes"]} min')

    lines.append("")
    lines.append("STUDY SPACES (live availability):")
    for s in SPACES_DB:
        lines.append(
            f'- {s["name"]} in {s["building"]} — {s["fill_pct"]}% full '
            f'({fill_to_status(s["fill_pct"])}), {s["type"]}, {s["seats"]} seats'
        )

    lines.append("")
    lines.append("CAMPUS EVENTS:")
    for e in EVENTS_DB:
        club = f' by {e["club"]}' if e.get("club") else ""
        lines.append(f'- {e["title"]}{club} — {e["location"]}, {e["start"]}')

    lines.append("")
    lines.append("GOOSE SIGHTINGS (user-reported):")
    for g in GOOSE_DB:
        lines.append(f'- {g["severity"]} sighting: {g.get("note", "")}')

    return "\n".join(lines)


@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
    """
    GoldenHawk AI endpoint.

    Sends the student's message + recent history to Claude with live campus
    data injected as context. Falls back to keyword rules when no API key is
    configured or the model is unreachable (see backend/goldenhawk.py).

    No auth required for Sprint 1 so the chat tab works in the demo; later
    sprints can gate this behind Laurier SSO and personalize per student.
    """
    reply, source = goldenhawk.get_reply(
        message=req.message,
        history=req.history,
        campus_context=build_campus_context(),
    )
    return {"reply": reply, "source": source}

# ── Health check ──────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": "Hawk Maps",
        "version": "0.1.0",
        "goldenhawk_ai": "connected" if goldenhawk.ai_available() else "fallback (no API key)",
    }
