/**
 * HawkMaps · src/constants/api.ts
 *
 * Shared backend config. Points at the Python/FastAPI backend (see backend/main.py).
 * Set it in a `.env` file at the project root (Expo auto-loads EXPO_PUBLIC_*):
 *   EXPO_PUBLIC_API_BASE=http://192.168.1.42:8000
 * Use your machine's LAN IP, NOT localhost — a physical phone can't reach
 * localhost on your computer. If unset, screens fall back to local demo data.
 */

import Constants from 'expo-constants';
const host = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || `http://${host}:8000`;
