"""
HawkMaps · backend/database.py

SQLite user database — replaces the old in-memory USERS_DB dict so accounts
(email + password) SURVIVE server restarts.

Passwords are never stored in plain text: each user gets a random salt and a
PBKDF2-SHA256 hash (stdlib only, no new dependencies).

Roles ("student" | "club_exec") and the exec's club live on the user row, so
login/`/api/auth/me` can grant permissions straight from the database.
Club-exec status is still granted manually (UPDATE the row) after the student
applies through the Google Form on the Events page.

The database file (hawkmaps.db, gitignored) is created and seeded with the
two demo accounts on first import.
"""

from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hawkmaps.db")

_PBKDF2_ITERATIONS = 100_000


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _PBKDF2_ITERATIONS
    ).hex()


def _row_to_user(row: sqlite3.Row) -> dict:
    return {
        "email": row["email"],
        "name":  row["name"],
        "role":  row["role"],
        "club":  row["club"],
    }


def init_db() -> None:
    """Create the users table and seed the demo accounts (idempotent)."""
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                email         TEXT PRIMARY KEY,
                name          TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                salt          TEXT NOT NULL,
                role          TEXT NOT NULL DEFAULT 'student',
                club          TEXT,
                created_at    TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
    # Drop legacy-format seed accounts (pre four-letters+four-digits rule) —
    # the strict email check would lock them out of login anyway.
    with _connect() as conn:
        conn.execute("DELETE FROM users WHERE email IN ('demo@mylaurier.ca', 'exec@mylaurier.ca')")
    # Demo accounts so the team can sign in without registering.
    if get_user("demo1234@mylaurier.ca") is None:
        create_user("demo1234@mylaurier.ca", "Demo Hawk", "hawkmaps", role="student")
    if get_user("exec1234@mylaurier.ca") is None:
        create_user("exec1234@mylaurier.ca", "Casey Exec", "hawkmaps", role="club_exec", club="CS Club")


def get_user(email: str) -> Optional[dict]:
    """Look up a user by email. Returns {email, name, role, club} or None."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email.strip().lower(),)
        ).fetchone()
    return _row_to_user(row) if row else None


def get_user_by_username(username: str) -> Optional[dict]:
    """Look up a user by the local part of their email (used by auth tokens)."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email LIKE ? || '@%'", (username.strip().lower(),)
        ).fetchone()
    return _row_to_user(row) if row else None


def create_user(email: str, name: str, password: str,
                role: str = "student", club: Optional[str] = None) -> dict:
    """Insert a new user with a salted PBKDF2 password hash."""
    salt = secrets.token_hex(16)
    with _connect() as conn:
        conn.execute(
            "INSERT INTO users (email, name, password_hash, salt, role, club) VALUES (?, ?, ?, ?, ?, ?)",
            (email.strip().lower(), name, _hash_password(password, salt), salt, role, club),
        )
    return {"email": email.strip().lower(), "name": name, "role": role, "club": club}


def verify_password(email: str, password: str) -> bool:
    """True if the password matches the stored hash for this email."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT password_hash, salt FROM users WHERE email = ?", (email.strip().lower(),)
        ).fetchone()
    if row is None:
        return False
    return secrets.compare_digest(row["password_hash"], _hash_password(password, row["salt"]))


# Create + seed on import so main.py can just `import database`.
init_db()
