-- Migration: helpful-vote RPC for reviews
-- Run this in the Supabase SQL editor AFTER the original schema.sql.
-- Adds a SECURITY DEFINER function that lets anonymous users increment or
-- decrement reviews.helpful_count without needing an UPDATE RLS policy.

-- ============================================================
-- Function: vote_review_helpful
-- ============================================================
-- delta must be one of (-2, -1, 1, 2):
--   +1 / -1  new vote applied or existing vote undone
--   +2 / -2  user switched direction (undo old + apply new in one call)
-- GREATEST(0, …) ensures the count never goes negative.

CREATE OR REPLACE FUNCTION vote_review_helpful(review_id TEXT, delta INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF delta NOT IN (-2, -1, 1, 2) THEN
    RAISE EXCEPTION 'vote_review_helpful: delta must be -2, -1, 1, or 2 (got %)', delta;
  END IF;

  UPDATE reviews
  SET helpful_count = GREATEST(0, helpful_count + delta)
  WHERE id = review_id;
END;
$$;

-- Grant execute to the anonymous / public role used by Supabase anon key
GRANT EXECUTE ON FUNCTION vote_review_helpful(TEXT, INTEGER) TO anon;
