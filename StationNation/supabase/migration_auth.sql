-- Migration: accounts for beta (Supabase Auth)
-- Run this in the Supabase SQL editor TOGETHER WITH deploying the auth
-- release of the app — the tightened policies below break anonymous
-- review inserts, which the alpha build relies on.
-- Prerequisites: schema.sql, migration_real_coords.sql, migration_helpful_votes.sql.

-- ============================================================
-- Profiles (one row per authenticated user)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL CHECK (char_length(trim(username)) BETWEEN 2 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usernames are public display names; enforce case-insensitive uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON profiles (lower(username));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read display names (they appear on public reviews).
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Users manage only their own profile row.
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Reviews: attribute to users, require auth, rate-limit
-- ============================================================

-- Nullable: alpha-era reviews predate accounts and keep user_id NULL.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);

-- Replace the open anonymous insert policy with authenticated-only,
-- and the row must belong to the caller.
DROP POLICY IF EXISTS "reviews_insert_anon" ON reviews;

CREATE POLICY "reviews_insert_authenticated"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Rate limit: one review per user per station per 12 hours, enforced
-- in the database so the client cannot bypass it.
CREATE OR REPLACE FUNCTION enforce_review_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'reviews require an authenticated user';
  END IF;
  IF EXISTS (
    SELECT 1 FROM reviews
    WHERE user_id = NEW.user_id
      AND station_id = NEW.station_id
      AND created_at > NOW() - INTERVAL '12 hours'
  ) THEN
    RAISE EXCEPTION 'rate limit: you already rated this station in the last 12 hours'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_rate_limit ON reviews;
CREATE TRIGGER on_review_rate_limit
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rate_limit();

-- ============================================================
-- Helpful votes: signed-in users only
-- ============================================================

REVOKE EXECUTE ON FUNCTION vote_review_helpful(TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION vote_review_helpful(TEXT, INTEGER) TO authenticated;
