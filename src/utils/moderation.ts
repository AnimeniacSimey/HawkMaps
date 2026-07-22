/**
 * HawkMaps · src/utils/moderation.ts
 *
 * Lightweight content check for user-submitted text (event titles,
 * descriptions, locations). Blocks profanity, slurs, and other content
 * inappropriate for a university club event.
 *
 * Mirrored on the backend (backend/main.py `contains_inappropriate`) — the
 * frontend check gives instant feedback, the backend check is the real
 * enforcement. Keep the two term lists in sync.
 *
 * Matching notes: terms match on WORD BOUNDARIES after normalising leetspeak
 * (f*ck → fuck, sh1t → shit), with optional whitespace allowed between the
 * term's letters. That catches spaced-out evasion like "f u c k" while clean
 * words that merely contain a bad substring — "class", "assessment",
 * "Scunthorpe" — can never trigger, because the letters inside them aren't
 * surrounded by word boundaries.
 */

// Profanity, slurs, sexual/violent content, hate symbols. Deliberately kept
// to unambiguous terms to avoid false positives on normal event text.
const BLOCKED_TERMS = [
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'shitty',
  'shithead', 'bitch', 'bitchy', 'asshole', 'ass', 'dumbass', 'jackass',
  'dick', 'dickhead', 'cock', 'pussy', 'cunt', 'bastard', 'slut', 'whore',
  'tits', 'boobs', 'blowjob', 'handjob', 'orgy', 'porn', 'hentai', 'faggot',
  'fag', 'nigger', 'nigga', 'retard', 'retarded', 'rape', 'raping', 'rapist',
  'nazi', 'hitler', 'kkk', 'kys', 'kill yourself', 'molest',
];

// Common leetspeak / symbol substitutions used to dodge filters.
// "*" and "#" are NOT stripped — they stay in the text and act as wildcards
// in the match ("sh*t" → matches "shit").
const LEET_MAP: Record<string, string> = {
  '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o',
  '$': 's', '5': 's', '7': 't', '.': '', '-': '', '_': '',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => (ch in LEET_MAP ? LEET_MAP[ch] : ch))
    .join('');
}

/**
 * Returns the first inappropriate term found in `text`, or null if clean.
 */
export function findInappropriate(text: string): string | null {
  const normalized = normalize(text);

  for (const term of BLOCKED_TERMS) {
    const letters = term.replace(/ /g, '');
    // Each letter may also be a censor symbol ("sh*t"), and an optional
    // plural "s" lets "dicks"/"sluts" match without loosening the trailing
    // boundary (which would false-positive on "Dickens" etc.).
    const body = letters.split('').map((c) => `[${c}*#]`).join('\\s*');
    const pattern = new RegExp(`\\b${body}s?\\b`);
    if (pattern.test(normalized)) return term;
  }
  return null;
}

/**
 * Validates club-event fields. Returns an error message to show the user,
 * or null if everything is acceptable. Mirrors the backend rules.
 */
export function validateEventInput(fields: {
  title: string;
  location: string;
  description?: string;
}): string | null {
  const title = fields.title.trim();
  const location = fields.location.trim();
  const description = (fields.description ?? '').trim();

  if (title.length < 3)        return 'Title must be at least 3 characters.';
  if (title.length > 80)       return 'Title must be 80 characters or fewer.';
  if (location.length > 60)    return 'Location must be 60 characters or fewer.';
  if (description.length > 500) return 'Description must be 500 characters or fewer.';

  for (const [label, value] of [['title', title], ['location', location], ['description', description]] as const) {
    if (value && findInappropriate(value)) {
      return `Please keep the ${label} appropriate for a university club event.`;
    }
  }
  return null;
}
