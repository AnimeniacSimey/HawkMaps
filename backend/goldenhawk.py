"""
GoldenHawk AI — the campus assistant brain for Hawk Maps.
CP317 · Wilfrid Laurier University

This module turns a student's chat message into a reply. It talks to a real
LLM (Anthropic's Claude) with live campus data injected as context, and falls
back to simple keyword rules when no API key is configured or the API is
unreachable — so the chat tab always answers, even offline.

Sprint 1 focus: detailed indoor/outdoor route suggestions, building hours,
study-space availability, and accessible entrances. Later sprints expand this
into an all-encompassing assistant.

Setup:
    pip install anthropic python-dotenv
    # then put your key in backend/.env :  ANTHROPIC_API_KEY=sk-ant-...

Optional env vars:
    GOLDENHAWK_MODEL   Claude model id (default: claude-opus-4-8)
"""

from __future__ import annotations

import os

# python-dotenv is optional — load backend/.env if it's installed.
try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover - dotenv just isn't installed
    pass

# The Anthropic SDK is optional at import time so the server still boots (and
# falls back to rules) before anyone runs `pip install anthropic`.
try:
    from anthropic import Anthropic

    _ANTHROPIC_IMPORT_OK = True
except Exception:  # pragma: no cover
    Anthropic = None  # type: ignore
    _ANTHROPIC_IMPORT_OK = False

GOLDENHAWK_MODEL = os.getenv("GOLDENHAWK_MODEL", "claude-opus-4-8")

# ── Persona / instructions ────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are GoldenHawk 🐥, the friendly campus assistant for Wilfrid Laurier
University's Waterloo campus, built into the Hawk Maps student app.

Your job is to help Laurier students get around campus and use it well. You can:
  • Give the FASTEST INDOOR ROUTE to a student's lecture hall or any building.
    First map the lecture hall to its building (see LECTURE HALLS), then build
    the route. Name the buildings/tunnels to pass, prefer indoor or covered
    connections so students stay dry, and give a rough walking time.
  • Answer questions about building and service hours (library, dining, gym,
    cafes, etc.).
  • Recommend study spaces based on how busy they are right now.
  • Point students to accessible entrances, ramps, and elevators.
  • Warn about closures and goose hotspots, and route around them.
  • Share what events are happening on campus.

Rules:
  • ONLY use the campus facts provided in the CAMPUS DATA section below. If you
    don't have the information (e.g. a building or room not listed), say so
    plainly and suggest checking the map tab — never invent buildings, rooms,
    hours, tunnels, or routes.
  • For route questions, DEFAULT to the fastest indoor/covered path when one
    exists — students often want to avoid rain, snow, or geese. Mention when a
    route keeps them dry. Always route around any active closures.
  • Be concise and conversational. A couple of short sentences is usually
    enough. A relevant emoji or two is welcome, but don't overdo it.
  • When giving directions, lead with the route, then the walking time.
  • You are a campus guide, not a general chatbot — gently redirect questions
    that have nothing to do with Laurier or campus life.
"""


def _build_messages(message: str, history: list[dict]) -> list[dict]:
    """Convert the app's chat history into Claude's messages format.

    The frontend sends history as {role: 'user'|'assistant', content: str}.
    The conversation opens with GoldenHawk's greeting (an assistant turn), so we
    drop any leading assistant turns — the first message must be from the user.
    """
    messages: list[dict] = []
    for turn in history or []:
        role = turn.get("role")
        content = (turn.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    # Claude requires the first message to be a user turn.
    while messages and messages[0]["role"] != "user":
        messages.pop(0)

    return messages


def _llm_reply(message: str, history: list[dict], campus_context: str) -> str:
    """Ask Claude. Raises on any API/SDK error so the caller can fall back."""
    client = Anthropic()  # reads ANTHROPIC_API_KEY from the environment

    system = f"{SYSTEM_PROMPT}\n\n=== CAMPUS DATA ===\n{campus_context}"

    response = client.messages.create(
        model=GOLDENHAWK_MODEL,
        max_tokens=1024,
        system=system,
        thinking={"type": "adaptive"},          # let Claude decide how much to think
        output_config={"effort": "low"},        # keep replies snappy for chat
        messages=_build_messages(message, history),
    )

    if response.stop_reason == "refusal":
        return ("I can't help with that one, but I'm great with campus routes, "
                "hours, study spots, and accessible entrances 🐥")

    reply = "".join(
        block.text for block in response.content if block.type == "text"
    ).strip()

    return reply or (
        "I didn't quite catch that — try asking about a route, building hours, "
        "or a good place to study 🐥"
    )


# ── Keyword fallback (used when there's no API key or the call fails) ───────
_RULE_RESPONSES: list[tuple[tuple[str, ...], str]] = [
    (("route", "how do i get", "direction", "navigate", "way to", "get to"),
     "From the main concourse, take the indoor tunnel through Peters, then "
     "follow the underground path to the BA Building — about 4 minutes 🗺️"),
    (("goose", "geese"),
     "⚠️ Aggressive geese reported near Alumni Hall. Use the Seagram Dr side "
     "entrance instead. Stay safe! 🪿"),
    (("hours", "open", "close", "when"),
     "Laurier Library: 8 AM–12 AM. Dining Hall: 7 AM–9 PM. Byte Café: 7:30 "
     "AM–8 PM. Athletic Complex: 6 AM–11 PM ☕"),
    (("study", "quiet", "work", "seat"),
     "The Lazaridis Atrium is only 25% full right now — lots of natural light "
     "and seats. The library's 2nd floor is also open for quiet study 📚"),
    (("event", "club", "happening", "this week"),
     "This week: CS Hackathon (BA 202), Open Mic Night (Turret), and the Eco "
     "Fair (Concourse) 🎉"),
    (("food", "eat", "dining", "cafe", "hungry", "menu"),
     "The Dining Hall has a new autumn menu this week! Byte Café and Wilf's "
     "Restaurant are also open on campus 🍽️"),
    (("accessible", "wheelchair", "elevator", "ramp", "mobility"),
     "Most buildings have accessible entrances on University Ave. The library "
     "has an east-entrance ramp off Bricker Ave with an elevator inside ♿"),
    (("shortcut", "faster", "tunnel", "indoor"),
     "⚡ There's an indoor tunnel from Peters Library to the BA Building — "
     "saves about 4 minutes and keeps you dry in bad weather!"),
]


def _rule_reply(message: str) -> str:
    lower = message.lower()
    for keywords, reply in _RULE_RESPONSES:
        if any(k in lower for k in keywords):
            return reply
    return ("I can help with campus routes, building hours, study spaces, club "
            "events, goose alerts, and accessible entrances 🐥 What do you need?")


def ai_available() -> bool:
    """True when a real LLM call is possible (SDK installed + key present)."""
    return _ANTHROPIC_IMPORT_OK and bool(os.getenv("ANTHROPIC_API_KEY"))


def get_reply(message: str, history: list[dict], campus_context: str) -> tuple[str, str]:
    """Return (reply_text, source) where source is 'goldenhawk-ai' or 'fallback'."""
    if ai_available():
        try:
            return _llm_reply(message, history, campus_context), "goldenhawk-ai"
        except Exception as exc:  # pragma: no cover - network/SDK errors
            print(f"[GoldenHawk] LLM call failed, using fallback: {exc}")
    return _rule_reply(message), "fallback"
