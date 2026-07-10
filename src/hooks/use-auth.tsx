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

// Laurier email domains accepted by HawkMaps.
const LAURIER_DOMAINS = ['@mylaurier.ca', '@wlu.ca'];

export function isLaurierEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return LAURIER_DOMAINS.some((d) => lower.endsWith(d)) && lower.indexOf('@') > 0;
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

/** POST to the backend and return the parsed body, throwing FastAPI's
 *  `detail` message on any non-2xx response so screens can show it. */
async function postJson(path: string, body: object): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail ?? 'Something went wrong — try again.');
  return data;
}

// ── Provider ────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = async (email: string, password: string) => {
    if (!isLaurierEmail(email)) {
      throw new Error('Use your Laurier email (…@mylaurier.ca).');
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
    if (!isLaurierEmail(email)) {
      throw new Error('Use your Laurier email (…@mylaurier.ca).');
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
