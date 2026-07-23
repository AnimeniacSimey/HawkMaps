/**
 * HawkMaps · src/config.ts
 *
 * Shared, COMMITTED default for the GoldenHawk AI backend URL. Because `.env`
 * files are gitignored, this is how the whole team gets "Live AI" by default:
 * after deploying the backend (see backend/DEPLOY.md), paste its public URL here
 * and commit. Everyone who pulls will then hit the hosted backend.
 *
 * Precedence: a local EXPO_PUBLIC_API_BASE in .env wins over this default, so you
 * can still point at your own machine while developing.
 *
 * Leave empty to keep the app in fully-offline mode (the on-device engine still
 * answers everything — it just won't use the live LLM).
 */
export const DEFAULT_API_BASE = 'https://hawkmaps-api.onrender.com';
