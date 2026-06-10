-- StationNation schema
-- Run this in the Supabase SQL editor to set up the stations and reviews tables.

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS stations (
  id              TEXT PRIMARY KEY,
  name            TEXT        NOT NULL,
  distance        TEXT        NOT NULL DEFAULT '',
  cleanliness_tier TEXT       NOT NULL DEFAULT 'unrated' CHECK (cleanliness_tier IN ('clean','mixed','gross','unrated')),
  score           NUMERIC(4,2) NOT NULL DEFAULT 0,
  rating_count    INTEGER     NOT NULL DEFAULT 0,
  freshness_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  safety_badges   TEXT[]      NOT NULL DEFAULT '{}',
  sub_ratings     JSONB       NOT NULL DEFAULT '{"clean":0,"friendly":0,"convenient":0}',
  latitude        NUMERIC(6,2) NOT NULL DEFAULT 50,
  longitude       NUMERIC(6,2) NOT NULL DEFAULT 50,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id               TEXT PRIMARY KEY,
  station_id       TEXT        NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  username         TEXT        NOT NULL,
  avatar_initials  TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  text             TEXT        NOT NULL DEFAULT '',
  score            NUMERIC(4,2) NOT NULL DEFAULT 0,
  helpful_count    INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS reviews_station_id_idx ON reviews(station_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews  ENABLE ROW LEVEL SECURITY;

-- Anonymous can read stations
CREATE POLICY "stations_select_anon"
  ON stations FOR SELECT
  USING (true);

-- Anonymous can read reviews
CREATE POLICY "reviews_select_anon"
  ON reviews FOR SELECT
  USING (true);

-- Anonymous can insert reviews (alpha — no auth required)
CREATE POLICY "reviews_insert_anon"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Trigger: recalculate station score on review insert
-- ============================================================

-- SECURITY DEFINER so the trigger can update stations despite RLS
-- (anonymous users have no UPDATE policy on stations, by design)
CREATE OR REPLACE FUNCTION recalculate_station_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE stations
  SET
    rating_count    = (SELECT COUNT(*)             FROM reviews WHERE station_id = NEW.station_id),
    score           = (SELECT ROUND(AVG(score)::NUMERIC, 2)
                       FROM reviews WHERE station_id = NEW.station_id),
    cleanliness_tier = CASE
                         WHEN (SELECT AVG(score) FROM reviews WHERE station_id = NEW.station_id) >= 4.0 THEN 'clean'
                         WHEN (SELECT AVG(score) FROM reviews WHERE station_id = NEW.station_id) <  2.5 THEN 'gross'
                         ELSE 'mixed'
                       END,
    freshness_hours = 0
  WHERE id = NEW.station_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalculate_station_score();
