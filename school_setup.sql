-- ─────────────────────────────────────────────────────────────────────────────
-- school_setup.sql
-- Multi-tenant SaaS: schools table + school_id foreign key plan
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. SCHOOLS TABLE ─────────────────────────────────────────────────────────
-- One row per school instance. The slug matches the JSON config file name
-- under src/content/schools/<slug>.json and the NEXT_PUBLIC_SCHOOL_SLUG env var.

CREATE TABLE IF NOT EXISTS schools (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,          -- e.g. "evergreen"
  name        text        NOT NULL,                 -- e.g. "Evergreen Preschool & Daycare"
  domain      text,                                 -- e.g. "https://evergreenprepschools.com"
  plan        text        NOT NULL DEFAULT 'basic', -- 'basic' | 'pro' | 'enterprise'
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed the existing Evergreen school
INSERT INTO schools (slug, name, domain, plan)
VALUES ('evergreen', 'Evergreen Preschool & Daycare', 'https://evergreenprepschools.com', 'pro')
ON CONFLICT (slug) DO NOTHING;


-- ── 2. TABLES THAT NEED school_id ────────────────────────────────────────────
-- Every data table should have a school_id so rows are isolated per tenant.
-- Phase 2 migration: add the column, backfill with the Evergreen school id,
-- then add the NOT NULL constraint and foreign key.

-- Helper: get Evergreen's id
-- SELECT id FROM schools WHERE slug = 'evergreen';

-- Pattern for each table (replace <table> with the actual table name):
--
--   ALTER TABLE <table>
--     ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);
--
--   UPDATE <table>
--     SET school_id = (SELECT id FROM schools WHERE slug = 'evergreen')
--     WHERE school_id IS NULL;
--
--   ALTER TABLE <table>
--     ALTER COLUMN school_id SET NOT NULL;
--
--   CREATE INDEX IF NOT EXISTS idx_<table>_school_id ON <table>(school_id);

-- Tables requiring school_id:
-- ─────────────────────────────
--   enquiries
--   parent_accounts
--   teacher_accounts
--   students
--   attendance
--   fee_assignments
--   fee_structures
--   expenses
--   staff
--   transport_routes
--   transport_assignments
--   transport_logs
--   gallery_photos
--   milestones
--   password_resets
--   teacher_applications

-- ── 3. ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────
-- Once school_id columns are added, enable RLS so the API key of one school
-- cannot accidentally read another school's data.

-- Example for enquiries (repeat for every table above):
--
--   ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
--
--   CREATE POLICY "school_isolation" ON enquiries
--     USING (school_id = current_setting('app.school_id')::uuid);
--
-- The app sets the session variable at the start of each request:
--   SET LOCAL app.school_id = '<uuid>';
--
-- This is most easily done in a Supabase Edge Function wrapper or a
-- custom Postgres role approach. For the initial release with a single
-- school, RLS is optional — add it before onboarding a second tenant.


-- ── 4. ADMIN_ACCOUNTS TABLE ──────────────────────────────────────────────────
-- Admins are school-scoped. Each admin belongs to exactly one school.

CREATE TABLE IF NOT EXISTS admin_accounts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  username      text        NOT NULL,
  password_hash text        NOT NULL,
  display_name  text,
  is_active     boolean     NOT NULL DEFAULT true,
  last_login    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, username)
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_school_id ON admin_accounts(school_id);


-- ── 5. SCHOOL_SETTINGS TABLE ─────────────────────────────────────────────────
-- Runtime overrides for config values stored in the JSON seed.
-- E.g. the owner can change the phone number from the Owner Portal
-- without redeploying.  Values here take precedence over the JSON file.

CREATE TABLE IF NOT EXISTS school_settings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid        NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  settings    jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed empty settings row for Evergreen
INSERT INTO school_settings (school_id, settings)
SELECT id, '{}'::jsonb FROM schools WHERE slug = 'evergreen'
ON CONFLICT (school_id) DO NOTHING;
