/**
 * HawkMaps · src/hooks/use-auth.tsx
 *
 * Auth state for the whole app (React context).
 * Talks to the Python backend at POST /api/auth/login and /api/auth/signup,
 * and falls back to a local demo mode when no backend is configured — same
 * pattern as the GoldenHawk chat tab, so the app always works in Expo Go.
 *
 * Usage:
 *   const { session, signIn, signUp, signOut } = useAuth();
 *
 * The root layout (src/app/_layout.tsx) uses `session` to decide whether the
 * user sees the (tabs) app or the welcome/login screens.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import { API_BASE } from '@/constants/api';

// Laurier emails are four letters followed by four digits, at @mylaurier.ca
// or @wlu.ca (e.g. pera1234@mylaurier.ca). Enforced at BOTH sign-in and
// signup — mirrored on the backend.
export function isValidLaurierEmail(email: string): boolean {
  return /^[a-z]{4}[0-9]{4}@(mylaurier\.ca|wlu\.ca)$/.test(email.trim().toLowerCase());
}

/** Error thrown by auth calls; `status` is the backend HTTP status when known.
 *  A 404 from sign-in means the account doesn't exist — the login screen uses
 *  that to offer "this account does not exist, sign up?". */
export class AuthError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// ── Types ───────────────────────────────────────────────────────────────
// Account designations: every signup is a "student"; "club_exec" is granted
// manually after applying via the Google Form linked on the Events page.
// Club execs can additionally create events for their own club (only).
export type UserRole = 'student' | 'club_exec';

export type Session = {
  token:    string;
  email:    string;
  username: string;
  role:     UserRole;
  club:     string | null;   // the exec's club — null for students
};

type AuthContextValue = {
  session: Session | null;
  signIn:  (email: string, password: string) => Promise<void>;
  signUp:  (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ─────────────────────────────────────────────────────────────
function sessionFromEmail(
  email: string,
  token: string,
  role: UserRole = 'student',
  club: string | null = null,
): Session {
  const clean = email.trim().toLowerCase();
  return { token, email: clean, username: clean.split('@')[0], role, club };
}

/** Demo-mode role: emails whose local part contains "exec" sign in as a
 *  CS Club executive so the exec-only UI is testable without a backend. */
function demoRole(email: string): { role: UserRole; club: string | null } {
  return email.trim().toLowerCase().split('@')[0].includes('exec')
    ? { role: 'club_exec', club: 'CS Club' }
    : { role: 'student', club: null };
}

/** POST to the backend and return the parsed body, throwing an AuthError
 *  with FastAPI's `detail` message (and the HTTP status) on any non-2xx. */
async function postJson(path: string, body: object): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.detail ?? 'Something went wrong — try again.', res.status);
  return data;
}

// ── Provider ────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = async (email: string, password: string) => {
    if (!isValidLaurierEmail(email)) {
      throw new Error('Must be a valid Laurier email');
    }
    if (!password) {
      throw new Error('Enter your password.');
    }

    if (!API_BASE) {
      // Demo mode — no backend configured, accept any Laurier email.
      const { role, club } = demoRole(email);
      setSession(sessionFromEmail(email, 'demo_token_local', role, club));
      return;
    }

    const data = await postJson('/api/auth/login', { email: email.trim().toLowerCase(), password });
    setSession(sessionFromEmail(email, data.access_token, data.role, data.club));
  };

  const signUp = async (name: string, email: string, password: string) => {
    // Email format: four letters + four digits (pera1234@mylaurier.ca).
    if (!isValidLaurierEmail(email)) {
      throw new Error('Must be a valid Laurier email');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (!API_BASE) {
      // Demo mode — no backend configured, accept any Laurier email.
      const { role, club } = demoRole(email);
      setSession(sessionFromEmail(email, 'demo_token_local', role, club));
      return;
    }

    const data = await postJson('/api/auth/signup', {
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      password,
    });
    setSession(sessionFromEmail(email, data.access_token, data.role, data.club));
  };

  const signOut = () => setSession(null);

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
