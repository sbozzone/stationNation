-- ═══════════════════════════════════════════════════════════════
-- Family Dinner Time — Supabase Migration
-- Run once in the Supabase SQL Editor:
--   supabase.com → Your Project → SQL Editor → New Query → Run
--
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards)
-- Preserves all existing data in families, dishes, pantry_items,
-- shopping_items — only adds missing columns and new tables.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Patch existing tables ─────────────────────────────────

-- families: add unique family code column
ALTER TABLE families ADD COLUMN IF NOT EXISTS code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS families_code_idx ON families(code);

-- pantry_items: app uses "quantity" (already exists) — add missing columns
ALTER TABLE pantry_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE pantry_items ADD COLUMN IF NOT EXISTS low_stock_alert_at NUMERIC DEFAULT 1;

-- shopping_items: app uses "is_checked" (already exists) — add missing columns
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS qty NUMERIC;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS added_from TEXT DEFAULT 'manual';

-- ─── 2. New tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meal_plan_days (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  dishes    JSONB DEFAULT '[]',
  UNIQUE(family_id, date)
);

-- New feature: activities that impact dinner planning
-- e.g. "Soccer 5-7pm", "Meeting during dinner", "Date night out"
CREATE TABLE IF NOT EXISTS day_activities (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  text        TEXT NOT NULL,
  impact_type TEXT NOT NULL DEFAULT 'custom',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_templates (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  days       JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Row Level Security ──────────────────────────────────────

ALTER TABLE families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS fdt_families   ON families;
DROP POLICY IF EXISTS fdt_dishes     ON dishes;
DROP POLICY IF EXISTS fdt_pantry     ON pantry_items;
DROP POLICY IF EXISTS fdt_shopping   ON shopping_items;
DROP POLICY IF EXISTS fdt_meal_plan  ON meal_plan_days;
DROP POLICY IF EXISTS fdt_activities ON day_activities;
DROP POLICY IF EXISTS fdt_templates  ON meal_templates;

CREATE POLICY fdt_families   ON families       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_dishes     ON dishes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_pantry     ON pantry_items   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_shopping   ON shopping_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_meal_plan  ON meal_plan_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_activities ON day_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_templates  ON meal_templates FOR ALL USING (true) WITH CHECK (true);
