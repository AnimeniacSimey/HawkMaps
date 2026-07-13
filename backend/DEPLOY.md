# Deploying GoldenHawk AI (make Live AI the default for everyone)

By default the app runs **offline** for teammates — the backend URL and API key
live in gitignored `.env` files, and a local backend is only reachable on one
Wi-Fi network. Deploy the backend once to a public host and the whole team gets
🟢 **Live AI** automatically.

The on-device engine still answers everything if the backend is ever down, so
this is a nice-to-have, not a requirement.

---

## Option A — Render (easiest, free)

1. Push this branch to GitHub (already done).
2. Go to **render.com → New → Blueprint**, connect the `HawkMaps` repo. Render
   reads [`render.yaml`](../render.yaml) and creates the `hawkmaps-api` service.
3. In the new service → **Environment**, add:
   - `GROQ_API_KEY` = your key from https://console.groq.com/keys  (**secret — set it here, never commit it**)
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (already defaulted)
4. Deploy. You'll get a public URL like `https://hawkmaps-api.onrender.com`.
5. Verify: open `https://hawkmaps-api.onrender.com/api/health` → should show
   `"goldenhawk_ai": "connected"`.

## Option B — Railway / Fly.io (Docker)

Uses [`backend/Dockerfile`](./Dockerfile). Create a service from the repo with
root `backend/`, set the same `GROQ_API_KEY` / `GROQ_MODEL` env vars, deploy.

---

## Final step — point the app at it

Paste the public URL into [`src/config.ts`](../src/config.ts):

```ts
export const DEFAULT_API_BASE = 'https://hawkmaps-api.onrender.com';
```

Commit that one line. Now every teammate who pulls, and every web build, defaults
to Live AI. (A local `.env` with `EXPO_PUBLIC_API_BASE` still overrides it for
your own machine.)

---

## Notes

- **Cost:** Groq's free tier has no card and generous limits, but it's shared
  across all users of the deployed backend. Heavy use may hit the rate limit —
  the app just falls back to offline, it won't crash.
- **Cold starts:** Render's free tier sleeps after ~15 min idle; the first
  request wakes it (~30–60s). During that wake the header may briefly show
  Offline, then flip to Live once it responds (the status dot re-checks every 15s).
- **CORS:** `main.py` currently allows all origins (`allow_origins=["*"]`) for
  easy testing. For production, restrict it to your app's real origin(s).
- **Secrets:** never commit `GROQ_API_KEY`. It belongs only in the host's env
  vars and your local `backend/.env` (gitignored).
