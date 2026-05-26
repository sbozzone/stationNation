-- ═══════════════════════════════════════════════════════════════
-- Family Dinner Time — Supabase Database Schema
-- Run once in the Supabase SQL Editor:
--   supabase.com → Your Project → SQL Editor → New Query
-- Safe to re-run (uses IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ═══════════════════════════════════════════════════════════════

-- ─── Tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS families (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dishes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  tags           TEXT[]  DEFAULT '{}',
  custom_tags    TEXT[]  DEFAULT '{}',
  appliances     TEXT[]  DEFAULT '{}',
  ingredients    JSONB   DEFAULT '[]',
  is_memory_meal BOOLEAN DEFAULT FALSE,
  source_url     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pantry_items (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id          UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  qty                NUMERIC DEFAULT 0,
  unit               TEXT    DEFAULT '',
  category           TEXT    NOT NULL DEFAULT 'Other',
  expiry_date        DATE,
  low_stock_alert_at NUMERIC DEFAULT 1,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS shopping_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  qty         NUMERIC,
  unit        TEXT,
  category    TEXT,
  checked_off BOOLEAN DEFAULT FALSE,
  added_from  TEXT    DEFAULT 'manual',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_templates (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  days       JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ─────────────────────────────────────────

ALTER TABLE families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fdt_families   ON families;
DROP POLICY IF EXISTS fdt_dishes     ON dishes;
DROP POLICY IF EXISTS fdt_pantry     ON pantry_items;
DROP POLICY IF EXISTS fdt_meal_plan  ON meal_plan_days;
DROP POLICY IF EXISTS fdt_activities ON day_activities;
DROP POLICY IF EXISTS fdt_shopping   ON shopping_items;
DROP POLICY IF EXISTS fdt_templates  ON meal_templates;

CREATE POLICY fdt_families   ON families       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_dishes     ON dishes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_pantry     ON pantry_items   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_meal_plan  ON meal_plan_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_activities ON day_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_shopping   ON shopping_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY fdt_templates  ON meal_templates FOR ALL USING (true) WITH CHECK (true);
