"""
Hawk Maps — FastAPI Backend
CP317 · Wilfrid Laurier University

Run (either works):
    pip install -r requirements.txt
    python main.py
    # or:
    uvicorn main:app --reload --reload-exclude "*.json" --reload-exclude "*.db" --host 0.0.0.0 --port 8000

IMPORTANT: goose_reports.json and hawkmaps.db both live in this same backend/
folder, which --reload watches for changes. Without the --reload-exclude
flags above (or running via `python main.py`, which sets them for you), every
goose report or signup write gets misread as a code change and triggers a
full server restart mid-request. Always exclude those two patterns.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
import os
import json

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
import database as db

# ── Dynamic Data Updaters ─────────────────────────────────────────────────
try:
    import update_locations
except ImportError:
    update_locations = None

try:
    import update_reviews
except ImportError:
    update_reviews = None


app = FastAPI(title="Hawk Maps API", version="0.1.0")

# ── CORS (allow React dev server / Expo) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev/testing: allow LAN web build + Expo Go
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth helpers ──────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=8)):
    """Return a signed JWT. Replace with real jose.jwt.encode in production."""
    return f"demo_token_{data.get('sub', 'user')}"

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validate JWT. Replace with real jose.jwt.decode in production."""
    if not token.startswith("demo_token_"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    username = token.replace("demo_token_", "")
    user = db.get_user_by_username(username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists")
    return {"username": username, "email": user["email"], "role": user["role"], "club": user["club"]}

# ── Models ────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
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

# ── Goose Sightings (File-based Persistence Setup) ────────────────────────
GOOSE_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "goose_reports.json")

def load_goose_reports() -> list[dict]:
    """Load reports from the local JSON file so they persist across restarts."""
    if os.path.exists(GOOSE_FILE_PATH):
        try:
            with open(GOOSE_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Goose DB] Error loading reports file: {e}")
    # Default initial seed data
    return [
        {"id": 1, "lat": 43.4735, "lng": -80.5260, "severity": "aggressive", "note": "Near Alumni Hall", "reported_at": "2024-11-08T08:30"},
        {"id": 2, "lat": 43.4730, "lng": -80.5270, "severity": "mild",       "note": "By library entrance", "reported_at": "2024-11-08T09:10"},
    ]

def save_goose_reports(reports: list[dict]) -> None:
    """Save reports list locally to JSON file."""
    try:
        os.makedirs(os.path.dirname(GOOSE_FILE_PATH), exist_ok=True)
        with open(GOOSE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(reports, f, indent=2)
        print(f"[Goose DB] Successfully saved {len(reports)} reports to {GOOSE_FILE_PATH}")
    except Exception as e:
        print(f"[Goose DB] ERROR saving reports file: {e}")

# Initialize in-memory DB from JSON file on import
GOOSE_DB: list[dict] = load_goose_reports()

# ── Startup Lifecycle Hook ────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    # Force creation/validation of goose_reports.json on server start
    save_goose_reports(GOOSE_DB)
    print(f"[Startup] goose_reports.json is ready at {GOOSE_FILE_PATH}")

    # Trigger updaters if they possess refresh/init procedures
    if update_locations and hasattr(update_locations, "refresh_locations"):
        try:
            update_locations.refresh_locations()
            print("[Startup] Triggered update_locations.refresh_locations()")
        except Exception as e:
            print(f"[Startup] Failed running update_locations: {e}")

    if update_reviews and hasattr(update_reviews, "refresh_reviews"):
        try:
            update_reviews.refresh_reviews()
            print("[Startup] Triggered update_reviews.refresh_reviews()")
        except Exception as e:
            print(f"[Startup] Failed running update_reviews: {e}")

# ── Helper Data Retrieval for Updaters ────────────────────────────────────
def get_current_spaces() -> list[dict]:
    """Fetch spaces from update_locations.getStudySpaceData() (backed by
    study_spaces.csv) if available, else fall back to the static SPACES_DB demo data.

    getStudySpaceData() returns rows shaped [name, busy_label, total_seats,
    occupied_seats] (strings), not the {id, name, seats, fill_pct, type,
    building} dicts the /api/spaces routes expect — so we convert here.

    Note: study_spaces.csv doesn't track a room "type" (quiet/collaborative/
    casual/etc) or a separate "building" field the way SPACES_DB does, so both
    are approximated for now. Add those columns to the CSV/update_locations.py
    later if per-type filtering on live data matters.
    """
    if update_locations and hasattr(update_locations, "getStudySpaceData"):
        try:
            rows = update_locations.getStudySpaceData()
        except Exception as e:
            print(f"[Spaces] Failed reading study_spaces.csv, using fallback: {e}")
            return SPACES_DB

        spaces = []
        for i, row in enumerate(rows, start=1):
            name, _busy_label, total_seats, occupied_seats = row
            total = int(total_seats)
            occupied = int(occupied_seats)
            fill_pct = round((occupied / total) * 100) if total else 0
            spaces.append({
                "id": i,
                "name": name,
                "seats": total,
                "fill_pct": fill_pct,
                "type": "open",    # not tracked in study_spaces.csv yet
                "building": name,  # ditto — csv has no separate building column
            })
        return spaces or SPACES_DB
    return SPACES_DB

def get_current_reviews() -> list[dict]:
    """Fetch reviews from update_reviews if available, else fallback to REVIEWS_DB."""
    if update_reviews:
        for fn_name in ("get_reviews", "reviews"):
            if hasattr(update_reviews, fn_name):
                return getattr(update_reviews, fn_name)()
    return REVIEWS_DB

# ── Auth Routes ───────────────────────────────────────────────────────────
LAURIER_EMAIL_RE = r"^[a-z]{4}[0-9]{4}@(mylaurier\.ca|wlu\.ca)$"

def is_valid_laurier_email(email: str) -> bool:
    import re
    return re.fullmatch(LAURIER_EMAIL_RE, email.strip().lower()) is not None

@app.post("/api/auth/signup", status_code=201)
def signup(req: SignupRequest):
    email = req.email.strip().lower()
    if not is_valid_laurier_email(email):
        raise HTTPException(status_code=400, detail="Must be a valid Laurier email")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if db.get_user(email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists — sign in instead")
    db.create_user(email, req.name.strip(), req.password, role="student")
    token = create_access_token({"sub": email.split("@")[0]})
    return {"access_token": token, "token_type": "bearer", "role": "student", "club": None}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    if not is_valid_laurier_email(email):
        raise HTTPException(status_code=400, detail="Must be a valid Laurier email")
    user = db.get_user(email)
    if user is None:
        raise HTTPException(status_code=404, detail="This account does not exist")
    if not db.verify_password(email, req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": email.split("@")[0]})
    return {"access_token": token, "token_type": "bearer",
            "role": user["role"], "club": user["club"]}

@app.get("/api/auth/sso")
def sso_redirect():
    sso_url = os.getenv("MICROSOFT_SSO_URL", "https://login.microsoftonline.com/YOUR_TENANT/oauth2/v2.0/authorize")
    return {"redirect_url": sso_url}

@app.get("/api/auth/me")
def get_me(user=Depends(get_current_user)):
    return {"username": user["username"], "email": user["email"],
            "role": user["role"], "club": user["club"]}

# ── Events Routes ─────────────────────────────────────────────────────────
EVENTS_DB: list[dict] = [
    {"id": 1, "title": "CS Club Hackathon",  "location": "BA 202",         "start": "2024-11-08T09:00", "club": "CS Club",     "tags": ["Tech"]},
    {"id": 2, "title": "Open Mic Night",     "location": "Turret Lounge",  "start": "2024-11-09T19:00", "club": "Music Club",  "tags": ["Social"]},
    {"id": 3, "title": "Eco Club Fair",      "location": "Concourse",      "start": "2024-11-10T11:00", "club": "Eco Club",    "tags": ["Environment"]},
    {"id": 4, "title": "Intramural Finals",  "location": "AC Gym",         "start": "2024-11-11T14:00", "club": "Athletics",   "tags": ["Sports"]},
    {"id": 5, "title": "Career Fair 2024",   "location": "Athletic Complex","start": "2024-11-15T10:00","club": None,          "tags": ["Career", "Free"]},
]

BLOCKED_TERMS = [
    "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "shitty",
    "shithead", "bitch", "bitchy", "asshole", "ass", "dumbass", "jackass",
    "dick", "dickhead", "cock", "pussy", "cunt", "bastard", "slut", "whore",
    "tits", "boobs", "blowjob", "handjob", "orgy", "porn", "hentai", "faggot",
    "fag", "nigger", "nigga", "retard", "retarded", "rape", "raping", "rapist",
    "nazi", "hitler", "kkk", "kys", "kill yourself", "molest",
]

_LEET_MAP = str.maketrans({
    "@": "a", "4": "a", "3": "e", "1": "i", "!": "i", "0": "o",
    "$": "s", "5": "s", "7": "t", ".": "", "-": "", "_": "",
})

def contains_inappropriate(text: str) -> Optional[str]:
    import re
    normalized = text.lower().translate(_LEET_MAP)
    for term in BLOCKED_TERMS:
        letters = term.replace(" ", "")
        pattern = r"\b" + r"\s*".join(f"[{re.escape(c)}*#]" for c in letters) + r"s?\b"
        if re.search(pattern, normalized):
            return term
    return None

def validate_event_input(title: str, location: str, description: str) -> None:
    if len(title) < 3:
        raise HTTPException(status_code=400, detail="Title must be at least 3 characters")
    if len(title) > 80:
        raise HTTPException(status_code=400, detail="Title must be 80 characters or fewer")
    if len(location) > 60:
        raise HTTPException(status_code=400, detail="Location must be 60 characters or fewer")
    if len(description) > 500:
        raise HTTPException(status_code=400, detail="Description must be 500 characters or fewer")
    for label, value in (("title", title), ("location", location), ("description", description)):
        if value and contains_inappropriate(value):
            raise HTTPException(
                status_code=400,
                detail=f"Please keep the {label} appropriate for a university club event",
            )

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
    if user["role"] != "club_exec":
        raise HTTPException(
            status_code=403,
            detail="Only club executives can create events — apply via the form on the Events page",
        )
    data = ev.model_dump() if hasattr(ev, "model_dump") else ev.dict()
    data["title"] = data["title"].strip()
    data["location"] = data["location"].strip()
    data["description"] = data["description"].strip()
    validate_event_input(data["title"], data["location"], data["description"])

    try:
        start_dt = datetime.fromisoformat(data["start_time"])
        end_dt = datetime.fromisoformat(data["end_time"])
    except ValueError:
        raise HTTPException(status_code=400, detail="Times must be ISO format, e.g. 2026-11-08T14:00")
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="The event must end after it starts")

    data["club"] = user["club"]
    new_ev = {
        "id": len(EVENTS_DB) + 1,
        "title":       data["title"],
        "description": data["description"],
        "location":    data["location"],
        "start":       data["start_time"],
        "end":         data["end_time"],
        "club":        data["club"],
        "tags":        ["Club"],
        "created_by":  user["username"],
        "created_at":  datetime.now(timezone.utc).isoformat(),
    }
    EVENTS_DB.append(new_ev)
    return new_ev

@app.get("/api/events/{event_id}")
def get_event(event_id: int):
    ev = next((e for e in EVENTS_DB if e["id"] == event_id), None)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev

@app.get("/status")
async def status():
    print("Someone requested /status")
    return {"ok": True}

# ── Study Spaces Routes (Dynamic) ─────────────────────────────────────────
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
    raw_spaces = get_current_spaces()
    spaces = [{"status": fill_to_status(s["fill_pct"]), **s} for s in raw_spaces]
    if type:
        spaces = [s for s in spaces if s["type"] == type]
    return spaces

@app.get("/api/spaces/available")
def get_available_spaces():
    """Returns spaces that are not full (fill_pct < 90)."""
    raw_spaces = get_current_spaces()
    spaces = [{"status": fill_to_status(s["fill_pct"]), **s} for s in raw_spaces]
    return [s for s in spaces if s["fill_pct"] < 90]

@app.get("/api/spaces/search")
def search_spaces(q: str = ""):
    """Case-insensitive search over study space names and buildings ("Find a space")."""
    query = q.strip().lower()
    raw_spaces = get_current_spaces()
    spaces = [{"status": fill_to_status(s["fill_pct"]), **s} for s in raw_spaces]
    if not query:
        return spaces
    return [
        s for s in spaces 
        if query in s.get("name", "").lower() or query in s.get("building", "").lower()
    ]

# ── Campus Map / Buildings ────────────────────────────────────────────────
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
    return BUILDING_HOURS.get(building_id, {"open": "N/A", "close": "N/A"})

# ── Goose Sightings Routes ────────────────────────────────────────────────
@app.get("/api/goose")
def list_goose_reports():
    return GOOSE_DB

@app.post("/api/goose", status_code=201)
def report_goose(report: GooseReport):
    if report.severity not in ("mild", "aggressive"):
        raise HTTPException(status_code=400, detail="severity must be 'mild' or 'aggressive'")
    
    report_dict = report.model_dump() if hasattr(report, "model_dump") else report.dict()
    
    new_r = {
        "id": len(GOOSE_DB) + 1,
        **report_dict,
        "reported_at": datetime.now(timezone.utc).isoformat()
    }
    GOOSE_DB.append(new_r)
    
    # Write updated array straight to JSON file
    save_goose_reports(GOOSE_DB)
    return new_r

# ── Indoor routes, lecture halls & closures ─────────────────────────────────
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

LECTURE_HALLS = [
    {"room": "BA 202",        "building": "Bricker Academic Building",  "note": "Large lecture theatre in Bricker Academic."},
    {"room": "N1001",         "building": "Science Building",           "note": "Ground-floor Science Building lecture hall."},
    {"room": "DAWB 2-101",    "building": "Dr. Alvin Woods Building",   "note": "Second-floor lecture room."},
    {"room": "LH 1002",       "building": "Lazaridis Hall",             "note": "Lecture hall in Lazaridis Hall (across University Ave)."},
    {"room": "P2027",         "building": "Frank C. Peters Building",   "note": "Classroom in the Peters Building."},
]

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

# ── Reviews Routes (Dynamic) ──────────────────────────────────────────────
REVIEWS_DB: list[dict] = []

@app.get("/api/reviews")
def list_reviews(target_id: Optional[str] = None, target_type: Optional[str] = None):
    results = get_current_reviews()
    if target_id:
        results = [r for r in results if str(r.get("target_id")) == str(target_id)]
    if target_type:
        results = [r for r in results if r.get("target_type") == target_type]
    return results

@app.post("/api/reviews", status_code=201)
def create_review(review: ReviewCreate, user=Depends(get_current_user)):
    if not 1 <= review.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    review_dict = review.model_dump() if hasattr(review, "model_dump") else review.dict()
    current_reviews = get_current_reviews()
    
    new_r = {
        "id": len(current_reviews) + 1,
        **review_dict,
        "author": user["username"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if update_reviews and hasattr(update_reviews, "add_review"):
        update_reviews.add_review(new_r)
    else:
        REVIEWS_DB.append(new_r)
        
    return new_r

# ── GoldenHawk AI Chat ────────────────────────────────────────────────────
def build_campus_context() -> str:
    """Serialize the FULL campus dataset (campus.json) so the LLM knows every
    building, nickname, room, floor and department the on-device engine does."""
    now = datetime.now(CAMPUS_TZ) if CAMPUS_TZ else datetime.now()
    nm = now.hour * 60 + now.minute
    now = datetime.now(CAMPUS_TZ) if CAMPUS_TZ else datetime.now()

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
    for b in BUILDINGS_DB:
        h = BUILDING_HOURS.get(b["id"], {})
        open_s, close_s = h.get("open", "N/A"), h.get("close", "N/A")
        core = "[core] " if b.get("connected") else "[outdoor walk] "
        code = f' ({b["code"]})' if b.get("code") else ""
        lines.append(
            f'- {core}{b["name"]}{code} — {b.get("street", "")}. {b.get("contains", "")}. '
            f'(hours {open_s}–{close_s}). Accessible: {b["accessible_entrance"]}.'
        )

    lines.append("")
    lines.append("LECTURE HALLS:")
    for r in LECTURE_HALLS:
        lines.append(f'- {r["room"]} is in {r["building"]} — {r["note"]}')

    lines.append("")
    lines.append("INDOOR / COVERED ROUTES:")
    for c in INDOOR_CONNECTIONS:
        lines.append(
            f'- {c["from"]} ↔ {c["to"]} via {c["type"]}, ~{c["minutes"]} min. {c["note"]}'
        )

    lines.append("")
    lines.append("STUDY SPACES:")
    for s in get_current_spaces():
        lines.append(
            f'- {s["name"]} in {s["building"]} — {s.get("fill_pct", 0)}% full '
            f'({fill_to_status(s.get("fill_pct", 0))}), {s.get("type", "open")}, {s.get("seats", 0)} seats'
        )

    lines.append("")
    lines.append("GOOSE SIGHTINGS:")
    for g in GOOSE_DB:
        lines.append(f'- {g["severity"]} sighting: {g.get("note", "")}')

    return "\n".join(lines)


@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
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

# ── Dev entrypoint ────────────────────────────────────────────────────────
# `python main.py` is the recommended way to run this locally — it bakes in
# the --reload-exclude flags so writing goose_reports.json or hawkmaps.db
# never gets mistaken for a code change and restarts the server mid-request.
# (If you prefer the `uvicorn` CLI directly, just pass the same two
# --reload-exclude flags shown in the module docstring above.)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["*.json", "*.db"],
    )