-- Migration: real-world coordinates for stations
-- Run this in the Supabase SQL editor AFTER the original schema.sql.
-- Widens latitude/longitude from the fictional 0-100 map grid to real
-- GPS coordinates (degrees, 6 decimal places ≈ 0.1 m precision).

ALTER TABLE stations
  ALTER COLUMN latitude  TYPE NUMERIC(9,6),
  ALTER COLUMN longitude TYPE NUMERIC(9,6);

-- The fictional seed stations (0-100 grid coords) are not real places.
-- Delete them before alpha testing, or leave them and they will sort to
-- the bottom of the distance-ordered list:
--   DELETE FROM reviews;
--   DELETE FROM stations;

-- ============================================================
-- Template: add the real gas stations in your alpha test area.
-- Get lat/lng from Google Maps (right-click a spot → copy coordinates).
-- distance is left '' — the app computes it live from the tester's GPS.
-- ============================================================

-- INSERT INTO stations (id, name, cleanliness_tier, safety_badges, latitude, longitude)
-- VALUES
--   ('shell-main-st',   'Shell — Main St & 5th',   'unrated', ARRAY['Lot well lit','24/7'], 34.052235, -118.243683),
--   ('chevron-hwy-101', 'Chevron — Hwy 101 Exit 3','unrated', '{}',                         34.061000, -118.252000);
