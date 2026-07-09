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

// ── API config ─────────────────────────────────────────────────────────
// Same convention as the GoldenHawk tab — set in a project-root `.env`:
//   EXPO_PUBLIC_API_BASE=http://192.168.1.42:8000
// If unset, auth runs in local demo mode (any Laurier email signs in).
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? '';

// Laurier email domains accepted by HawkMaps.
const LAURIER_DOMAINS = ['@mylaurier.ca', '@wlu.ca'];

export function isLaurierEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return LAURIER_DOMAINS.some((d) => lower.endsWith(d)) && lower.indexOf('@') > 0;
}

// ── Types ───────────────────────────────────────────────────────────────
export type Session = {
  token:    string;
  email:    string;
  username: string;
};

type AuthContextValue = {
  session: Session | null;
  signIn:  (email: string, password: string) => Promise<void>;
  signUp:  (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ─────────────────────────────────────────────────────────────
function sessionFromEmail(email: string, token: string): Session {
  const clean = email.trim().toLowerCase();
  return { token, email: clean, username: clean.split('@')[0] };
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
      setSession(sessionFromEmail(email, 'demo_token_local'));
      return;
    }

    const data = await postJson('/api/auth/login', { email: email.trim().toLowerCase(), password });
    setSession(sessionFromEmail(email, data.access_token));
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
      setSession(sessionFromEmail(email, 'demo_token_local'));
      return;
    }

    const data = await postJson('/api/auth/signup', {
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      password,
    });
    setSession(sessionFromEmail(email, data.access_token));
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
