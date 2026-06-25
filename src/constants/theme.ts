/**
 * HawkMaps Theme
 * Wilfrid Laurier University · CP317
 *
 * To change brand colours, edit BRAND below.
 * Everything else derives from it automatically.
 */

import '@/global.css';
import { Platform } from 'react-native';

// ── Brand palette ─────────────────────────────────────────────────────────
export const BRAND = {
  purple:      '#7B2FBE',
  purpleLight: '#F3E8FF',
  purpleDark:  '#6B21A8',
  gold:        '#C8991A',
  goldLight:   '#FAEEDA',
  dark:        '#1a1a2e',
  dark2:       '#2d1b69',
} as const;

// ── Status colours (used across map pins, badges, etc.) ──────────────────
export const STATUS_COLORS = {
  open:  { bg: '#EAF3DE', text: '#3B6D11', fill: '#3B6D11' },
  busy:  { bg: '#FAEEDA', text: '#854F0B', fill: '#854F0B' },
  full:  { bg: '#FCEBEB', text: '#A32D2D', fill: '#A32D2D' },
  alert: { bg: '#FCEBEB', text: '#A32D2D', fill: '#A32D2D' },
} as const;

// ── Light / dark mode colours ─────────────────────────────────────────────
export const Colors = {
  light: {
    text:               '#000000',
    background:         '#ffffff',
    backgroundElement:  '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary:      '#60646C',
    // HawkMaps additions
    brand:              BRAND.purple,
    brandLight:         BRAND.purpleLight,
    border:             'rgba(0,0,0,0.12)',
    cardBg:             '#ffffff',
  },
  dark: {
    text:               '#ffffff',
    background:         '#000000',
    backgroundElement:  '#212225',
    backgroundSelected: '#2E3135',
    textSecondary:      '#B0B4BA',
    // HawkMaps additions
    brand:              BRAND.purple,
    brandLight:         '#3D1870',
    border:             'rgba(255,255,255,0.12)',
    cardBg:             '#1a1a1a',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    'var(--font-display)',
    serif:   'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono:    'var(--font-mono)',
  },
});

export const Spacing = {
  half:  2,
  one:   4,
  two:   8,
  three: 16,
  four:  24,
  five:  32,
  six:   64,
} as const;

export const BottomTabInset  = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
