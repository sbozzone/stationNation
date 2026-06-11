import { supabase } from './supabase';
import type { Station, Review, CleanlinessTier, SafetyBadge, SubRatings } from '../app/types';

// ── DB row shapes ──────────────────────────────────────────────────────────────

interface StationRow {
  id: string;
  name: string;
  distance: string;
  cleanliness_tier: string;
  score: number;
  rating_count: number;
  freshness_hours: number;
  safety_badges: string[];
  sub_ratings: { clean: number; friendly: number; convenient: number };
  latitude: number;
  longitude: number;
  created_at: string;
  reviews?: ReviewRow[];
}

interface ReviewRow {
  id: string;
  station_id: string;
  username: string;
  avatar_initials: string;
  created_at: string;
  text: string;
  score: number;
  helpful_count: number;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapReview(row: ReviewRow): Review {
  // Convert ISO timestamp to a human-readable "time ago" string
  const diffMs = Date.now() - new Date(row.created_at).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  let timestamp: string;
  if (diffHours < 1) {
    timestamp = 'Just now';
  } else if (diffHours < 24) {
    timestamp = `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    timestamp = `${diffDays}d ago`;
  }

  return {
    id: row.id,
    username: row.username,
    avatarInitials: row.avatar_initials,
    timestamp,
    text: row.text,
    score: Number(row.score),
    helpfulCount: row.helpful_count,
    userVoted: null,
  };
}

function mapStation(row: StationRow): Station {
  return {
    id: row.id,
    name: row.name,
    distance: row.distance,
    cleanlinessTier: row.cleanliness_tier as CleanlinessTier,
    score: Number(row.score),
    ratingCount: row.rating_count,
    freshnessHours: Number(row.freshness_hours),
    safetyBadges: (row.safety_badges ?? []) as SafetyBadge[],
    subRatings: row.sub_ratings as SubRatings,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    reviews: (row.reviews ?? []).map(mapReview),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch all stations with their reviews.
 * Returns null on any error so the caller can fall back to mock data.
 */
export async function fetchStations(): Promise<Station[] | null> {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('*, reviews(*)')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[StationNation] fetchStations error:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return (data as StationRow[]).map(mapStation);
  } catch (err) {
    console.error('[StationNation] fetchStations unexpected error:', err);
    return null;
  }
}

/**
 * Increment or decrement reviews.helpful_count via a SECURITY DEFINER RPC.
 * delta must be -2, -1, 1, or 2 (the DB function enforces this).
 * Returns true on success, false on failure (caller keeps optimistic local update either way).
 */
export async function voteReviewHelpful(reviewId: string, delta: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('vote_review_helpful', {
      review_id: reviewId,
      delta,
    });

    if (error) {
      console.error('[StationNation] voteReviewHelpful error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[StationNation] voteReviewHelpful unexpected error:', err);
    return false;
  }
}

/**
 * Fetch reviewer rank for the given username.
 * Aggregates review counts per username client-side (dataset is tiny in alpha)
 * and returns the 1-based rank (1 = most reviews) plus total distinct reviewers.
 * Returns null on error or if the user has submitted no reviews.
 */
export async function fetchReviewerRank(
  username: string
): Promise<{ rank: number; total: number } | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('username');

    if (error) {
      console.error('[StationNation] fetchReviewerRank error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    // Aggregate counts per reviewer
    const counts: Record<string, number> = {};
    for (const row of data as { username: string }[]) {
      counts[row.username] = (counts[row.username] ?? 0) + 1;
    }

    const userCount = counts[username];
    if (!userCount) return null; // user has no reviews

    // Sort reviewers descending by count; ties share the better rank (dense rank)
    const sorted = Object.values(counts).sort((a, b) => b - a);

    // Find position of the first entry equal to this user's count
    const rank = sorted.indexOf(userCount) + 1;
    const total = sorted.length;

    return { rank, total };
  } catch (err) {
    console.error('[StationNation] fetchReviewerRank unexpected error:', err);
    return null;
  }
}

/**
 * Result of a review submission:
 *  - true          → inserted successfully
 *  - 'rate_limited'→ rejected by the 12h-per-station rate-limit trigger
 *  - false         → any other failure (network, auth, validation)
 */
export type SubmitReviewResult = true | false | 'rate_limited';

/**
 * Insert a new review for a station, attributed to the signed-in user.
 * The DB trigger recalculates the station's score and rating_count, and
 * enforces the 12h-per-station rate limit (raising a 'rate limit …' error).
 * Returns 'rate_limited' when that trigger rejects the insert so the caller
 * can roll back its optimistic update; true on success; false otherwise.
 */
export async function submitReview(
  stationId: string,
  userId: string,
  review: {
    id: string;
    username: string;
    avatarInitials: string;
    text: string;
    score: number;
  }
): Promise<SubmitReviewResult> {
  try {
    const { error } = await supabase.from('reviews').insert({
      id: review.id,
      station_id: stationId,
      user_id: userId,
      username: review.username,
      avatar_initials: review.avatarInitials,
      text: review.text,
      score: review.score,
      helpful_count: 0,
    });

    if (error) {
      // The rate-limit trigger raises a message containing 'rate limit'.
      if (error.message.toLowerCase().includes('rate limit')) {
        return 'rate_limited';
      }
      console.error('[StationNation] submitReview error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[StationNation] submitReview unexpected error:', err);
    return false;
  }
}

// ── Profiles (Supabase Auth accounts) ───────────────────────────────────────────

interface ProfileRow {
  id: string;
  username: string;
  created_at: string;
}

/**
 * Result of a profile insert/update that may collide on the unique username index:
 *  - true            → succeeded
 *  - 'name_taken'    → unique-violation on lower(username)
 *  - false           → any other failure
 */
export type ProfileWriteResult = true | false | 'name_taken';

/**
 * Fetch the signed-in user's profiles row.
 * Returns the row, null if none exists, or null on error (treated as "no row").
 */
export async function fetchMyProfile(
  userId: string
): Promise<{ id: string; username: string } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[StationNation] fetchMyProfile error:', error.message);
      return null;
    }

    if (!data) return null;
    const row = data as ProfileRow;
    return { id: row.id, username: row.username };
  } catch (err) {
    console.error('[StationNation] fetchMyProfile unexpected error:', err);
    return null;
  }
}

/**
 * Detect a Postgres unique-violation (SQLSTATE 23505) from a Supabase error.
 */
function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || (error.message ?? '').toLowerCase().includes('duplicate key');
}

/**
 * Create the signed-in user's profiles row with the given username.
 * Returns 'name_taken' on the unique-violation so the caller can prompt for
 * a different name; true on success; false on any other failure.
 */
export async function createMyProfile(
  userId: string,
  username: string
): Promise<ProfileWriteResult> {
  try {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      username: username.trim(),
    });

    if (error) {
      if (isUniqueViolation(error)) return 'name_taken';
      console.error('[StationNation] createMyProfile error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[StationNation] createMyProfile unexpected error:', err);
    return false;
  }
}

/**
 * Update the signed-in user's profiles.username.
 * Returns 'name_taken' on the unique-violation; true on success; false otherwise.
 */
export async function updateMyUsername(
  userId: string,
  username: string
): Promise<ProfileWriteResult> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', userId);

    if (error) {
      if (isUniqueViolation(error)) return 'name_taken';
      console.error('[StationNation] updateMyUsername error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[StationNation] updateMyUsername unexpected error:', err);
    return false;
  }
}
