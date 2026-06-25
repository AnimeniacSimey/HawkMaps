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

app = FastAPI(title="Hawk Maps API", version="0.1.0")

# ── CORS (allow React dev server) ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
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

@app.get("/api/spaces")
def list_spaces(type: Optional[str] = None):
    spaces = [{"status": fill_to_status(s["fill_pct"]), **s} for s in SPACES_DB]
    if type:
        spaces = [s for s in spaces if s["type"] == type]
    return spaces

# ── Campus Map / Buildings ────────────────────────────────────────────────
BUILDINGS_DB = [
    {"id":1, "name":"Science Building",    "lat":43.4728,"lng":-80.5271, "accessible_entrance":"West entrance, ramp on University Ave"},
    {"id":2, "name":"BA Building",         "lat":43.4734,"lng":-80.5262, "accessible_entrance":"Main entrance, automatic doors"},
    {"id":3, "name":"Peters Library",      "lat":43.4740,"lng":-80.5248, "accessible_entrance":"East entrance off Bricker Ave"},
    {"id":4, "name":"Dining Hall",         "lat":43.4724,"lng":-80.5274, "accessible_entrance":"South entrance, ramp on Ezra Ave"},
    {"id":5, "name":"Lazaridis Hall",      "lat":43.4731,"lng":-80.5258, "accessible_entrance":"King St entrance, automatic doors"},
    {"id":6, "name":"Athletic Complex",    "lat":43.4736,"lng":-80.5244, "accessible_entrance":"North entrance off University Ave"},
]

@app.get("/api/buildings")
def list_buildings():
    return BUILDINGS_DB

@app.get("/api/buildings/{building_id}/hours")
def building_hours(building_id: int):
    """Returns today's hours. TODO: pull from live Laurier data source."""
    hours = {
        1: {"open": "07:00", "close": "22:00"},
        2: {"open": "07:30", "close": "22:30"},
        3: {"open": "08:00", "close": "00:00"},
        4: {"open": "07:00", "close": "21:00"},
        5: {"open": "07:00", "close": "22:00"},
        6: {"open": "06:00", "close": "23:00"},
    }
    return hours.get(building_id, {"open": "N/A", "close": "N/A"})

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
@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest, user=Depends(get_current_user)):
    """
    GoldenHawk AI endpoint.
    TODO: Replace rule-based responses with an LLM call (e.g. OpenAI / Anthropic)
    that has campus data injected as context.
    """
    msg = req.message.lower()

    RULE_RESPONSES = {
        ("route", "how do i get", "direction", "navigate"):
            "From the main concourse, take the indoor tunnel through Peters, then follow the underground path to BA. Room 202 is on the east side of floor 2 — about 4 minutes 🗺️",
        ("goose", "geese"):
            "⚠️ 3 goose sightings near Alumni Hall today. I'd recommend using the Seagram Dr side entrance instead. Stay safe! 🪿",
        ("hours", "open", "close", "when"):
            "Peters Library is open 8 AM–12 AM. The Dining Hall runs 7 AM–9 PM. Byte Café opens at 7:30 AM ☕",
        ("study", "quiet", "work"):
            "Peters Library 2nd floor is 40% full right now — great spot for quiet work. Lazaridis atrium is also open with lots of seats 📚",
        ("event", "club", "what's on"):
            "This week: CS Hackathon (Nov 8, BA 202), Open Mic Night (Nov 9, Turret), Eco Fair (Nov 10, Concourse) 🎉",
        ("food", "eat", "dining", "cafe", "menu"):
            "Dining Hall is running their new autumn menu this week! Byte Café and the food court are also open on campus 🍽️",
        ("accessible", "wheelchair", "elevator", "ramp"):
            "Most buildings have accessible entrances on University Ave. Peters Library has an east entrance ramp. I can guide you to any specific building ♿",
    }

    for keys, reply in RULE_RESPONSES.items():
        if any(k in msg for k in keys):
            return {"reply": reply}

    return {"reply": "I can help with indoor routes, building hours, study space availability, club events, goose alerts, and accessible entrances 🐥 What do you need?"}

# ── Health check ──────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Hawk Maps", "version": "0.1.0"}
