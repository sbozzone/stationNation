/**
 * profile.ts — local profile persistence for StationNation.
 * Plain TS, no React. All localStorage access is guarded for SSR.
 */

const PROFILE_KEY = 'stationnation.profile';

export interface RecentActivityEntry {
  stationName: string;
  score: number;
  text: string;
  ratedAt: string; // ISO
}

export interface Profile {
  username: string;
  points: number;
  streak: number;
  stationsRated: number;
  peopleHelped: number;
  lastRatedDay?: string;
  onboarded: boolean;
  createdAt?: string; // ISO — set once on first save
  recentActivity?: RecentActivityEntry[]; // last 10, newest first
}

const DEFAULT_PROFILE: Profile = {
  username: '',
  points: 0,
  streak: 0,
  stationsRated: 0,
  peopleHelped: 0,
  lastRatedDay: undefined,
  onboarded: false,
  createdAt: undefined,
  recentActivity: [],
};

/**
 * Derive avatar initials from a nickname.
 * Takes the first letter of up to two words, uppercased.
 * Falls back to '??' if the name is empty.
 */
export function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '??';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Load the profile from localStorage.
 * Returns DEFAULT_PROFILE on SSR, parse errors, or missing key.
 */
export function loadProfile(): Profile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      username: typeof parsed.username === 'string' ? parsed.username : DEFAULT_PROFILE.username,
      points: typeof parsed.points === 'number' ? parsed.points : DEFAULT_PROFILE.points,
      streak: typeof parsed.streak === 'number' ? parsed.streak : DEFAULT_PROFILE.streak,
      stationsRated: typeof parsed.stationsRated === 'number' ? parsed.stationsRated : DEFAULT_PROFILE.stationsRated,
      peopleHelped: typeof parsed.peopleHelped === 'number' ? parsed.peopleHelped : DEFAULT_PROFILE.peopleHelped,
      lastRatedDay: typeof parsed.lastRatedDay === 'string' ? parsed.lastRatedDay : undefined,
      onboarded: typeof parsed.onboarded === 'boolean' ? parsed.onboarded : DEFAULT_PROFILE.onboarded,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : undefined,
      recentActivity: Array.isArray(parsed.recentActivity) ? parsed.recentActivity : [],
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Save the profile to localStorage.
 * Sets createdAt to the current ISO timestamp if it is not already set.
 * No-op on SSR.
 */
export function saveProfile(profile: Profile): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: Profile = {
      ...profile,
      createdAt: profile.createdAt ?? new Date().toISOString(),
    };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage quota or private-mode errors — silently ignore.
  }
}

/**
 * Compute today's date string (YYYY-MM-DD) in local time.
 */
export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Given the current streak and lastRatedDay, compute the new streak
 * and updated lastRatedDay after a rating submission today.
 *
 * Rules:
 *  - Same day as lastRatedDay → no change.
 *  - Yesterday → streak + 1.
 *  - Anything else (older or never) → streak resets to 1.
 */
export function computeNewStreak(
  currentStreak: number,
  lastRatedDay: string | undefined,
): { newStreak: number; newLastRatedDay: string } {
  const today = todayString();

  if (lastRatedDay === today) {
    // Already rated today — keep streak unchanged.
    return { newStreak: currentStreak, newLastRatedDay: today };
  }

  if (lastRatedDay) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yy = yesterday.getFullYear();
    const ym = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yy}-${ym}-${yd}`;

    if (lastRatedDay === yesterdayStr) {
      return { newStreak: currentStreak + 1, newLastRatedDay: today };
    }
  }

  // First ever rating, or gap of 2+ days → reset to 1.
  return { newStreak: 1, newLastRatedDay: today };
}
