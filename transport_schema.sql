-- ═══════════════════════════════════════════════════════════
-- Transport feature schema
-- Run this in Supabase SQL editor
-- ═══════════════════════════════════════════════════════════

-- 1. Transport opt-ins: one record per child
--    mode controls how long the opt-in is active
CREATE TABLE IF NOT EXISTS transport_opt_ins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL UNIQUE,        -- one row per child
  child_name   TEXT NOT NULL,
  parent_phone TEXT NOT NULL DEFAULT '',
  opted_in     BOOLEAN NOT NULL DEFAULT false,
  mode         TEXT NOT NULL DEFAULT 'permanent',
  -- mode values:
  --   permanent  → always active (no expiry)
  --   today      → only the current calendar day
  --   week       → start_date to start_date + 6 days
  --   month      → start_date to start_date + 29 days
  --   custom     → start_date to end_date (user-chosen)
  start_date    DATE,                       -- when opt-in becomes active
  end_date      DATE,                       -- when opt-in expires (NULL = permanent)
  pickup_order  INT NOT NULL DEFAULT 0,     -- morning pickup sequence (1 = first)
  drop_order    INT NOT NULL DEFAULT 0,     -- afternoon drop sequence (1 = first)
  updated_by    TEXT NOT NULL DEFAULT 'parent',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Live vehicle location (one row per route, updated in real time by any staff)
CREATE TABLE IF NOT EXISTS vehicle_location (
  route_id    TEXT PRIMARY KEY,
  route_name  TEXT NOT NULL DEFAULT '',
  latitude    DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude   DOUBLE PRECISION NOT NULL DEFAULT 0,
  shared_by   TEXT NOT NULL DEFAULT '',   -- name of the staff member currently sharing
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO vehicle_location (route_id, route_name, latitude, longitude)
VALUES
  ('route_morning',   'Morning Route',   0, 0),
  ('route_afternoon', 'Afternoon Route', 0, 0)
ON CONFLICT (route_id) DO NOTHING;

-- 3. Ride logs: daily boarding / alighting records per child
CREATE TABLE IF NOT EXISTS ride_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      UUID NOT NULL,
  child_name    TEXT NOT NULL,
  date          DATE NOT NULL,
  checkin_time  TEXT,
  checkout_time TEXT,
  checked_by    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'waiting',  -- waiting | boarded | dropped | absent
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, date)
);

-- ───────────────────────────────────────────────────────────
-- Enable Realtime on vehicle_location for live map
-- ───────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_location;

-- If tables already exist, add new columns:
-- ALTER TABLE transport_opt_ins ADD COLUMN IF NOT EXISTS pickup_order INT NOT NULL DEFAULT 0;
-- ALTER TABLE transport_opt_ins ADD COLUMN IF NOT EXISTS drop_order INT NOT NULL DEFAULT 0;
-- ALTER TABLE vehicle_location  ADD COLUMN IF NOT EXISTS shared_by TEXT NOT NULL DEFAULT '';

-- ───────────────────────────────────────────────────────────
-- Indexes
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transport_opt_ins_child   ON transport_opt_ins (child_id);
CREATE INDEX IF NOT EXISTS idx_transport_opt_ins_opted   ON transport_opt_ins (opted_in);
CREATE INDEX IF NOT EXISTS idx_ride_logs_date            ON ride_logs (date);
CREATE INDEX IF NOT EXISTS idx_ride_logs_child           ON ride_logs (child_id);


-- ═══════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY + GRANTS
-- Run this block after creating the tables above.
-- ═══════════════════════════════════════════════════════════

-- transport_opt_ins
ALTER TABLE transport_opt_ins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transport_opt_ins_all" ON transport_opt_ins;
CREATE POLICY "transport_opt_ins_all" ON transport_opt_ins
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON transport_opt_ins TO anon;
GRANT ALL ON transport_opt_ins TO authenticated;
GRANT ALL ON transport_opt_ins TO service_role;

-- vehicle_location
ALTER TABLE vehicle_location ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vehicle_location_all" ON vehicle_location;
CREATE POLICY "vehicle_location_all" ON vehicle_location
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON vehicle_location TO anon;
GRANT ALL ON vehicle_location TO authenticated;
GRANT ALL ON vehicle_location TO service_role;

-- ride_logs
ALTER TABLE ride_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ride_logs_all" ON ride_logs;
CREATE POLICY "ride_logs_all" ON ride_logs
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON ride_logs TO anon;
GRANT ALL ON ride_logs TO authenticated;
GRANT ALL ON ride_logs TO service_role;

-- sequences (for UUID generation if using serial fallback)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ═══════════════════════════════════════════════════════════
-- 4. Vehicle location HISTORY
--    Every GPS push is appended here (current position stays
--    in vehicle_location; this table is the full trail).
--    Run this block to add reporting support.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vehicle_location_history (
  id          BIGSERIAL PRIMARY KEY,
  route_id    TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  shared_by   TEXT NOT NULL DEFAULT '',
  date        DATE NOT NULL,          -- IST calendar date (for easy per-day queries)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vlh_date_route
  ON vehicle_location_history (date DESC, route_id);

ALTER TABLE vehicle_location_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vlh_all" ON vehicle_location_history;
CREATE POLICY "vlh_all" ON vehicle_location_history
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON vehicle_location_history TO anon;
GRANT ALL ON vehicle_location_history TO authenticated;
GRANT ALL ON vehicle_location_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE vehicle_location_history_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE vehicle_location_history_id_seq TO authenticated;

-- ───────────────────────────────────────────────────────────
-- 5. Audit columns for ride_logs
--    boarded_by / dropped_by track WHICH staff member did each action,
--    independent of the last-updated checked_by.
-- ───────────────────────────────────────────────────────────

ALTER TABLE ride_logs ADD COLUMN IF NOT EXISTS boarded_by TEXT;
ALTER TABLE ride_logs ADD COLUMN IF NOT EXISTS dropped_by TEXT;

-- ───────────────────────────────────────────────────────────
-- 6. Transport settings (key-value store for admin toggles)
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transport_settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default: auto-cleanup is active (not paused)
INSERT INTO transport_settings (setting_key, setting_value)
VALUES ('cleanup_paused', 'false')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE transport_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ts_all" ON transport_settings;
CREATE POLICY "ts_all" ON transport_settings FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON transport_settings TO anon;
GRANT ALL ON transport_settings TO authenticated;
GRANT ALL ON transport_settings TO service_role;

-- ───────────────────────────────────────────────────────────
-- 7. Cleanup function — checks the pause flag before deleting
--    pg_cron calls this function; the manual API button calls
--    the direct DELETE (always runs regardless of the flag).
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION run_transport_cleanup_auto()
RETURNS TEXT LANGUAGE plpgsql AS $func$
DECLARE
  paused boolean;
BEGIN
  SELECT COALESCE(
    (SELECT setting_value::boolean
     FROM transport_settings
     WHERE setting_key = 'cleanup_paused'),
    false
  ) INTO paused;

  IF paused THEN
    RETURN 'skipped (paused by admin)';
  END IF;

  DELETE FROM vehicle_location_history
    WHERE recorded_at < NOW() - INTERVAL '7 days';

  DELETE FROM ride_logs
    WHERE date < (NOW() - INTERVAL '30 days')::date;

  RETURN 'done';
END;
$func$;

-- ───────────────────────────────────────────────────────────
-- 8. Weekly auto-cleanup via pg_cron
--    Requires pg_cron extension:
--    Supabase Dashboard → Database → Extensions → enable pg_cron
--    Run the SELECT below ONCE to register the job.
-- ───────────────────────────────────────────────────────────
/*
SELECT cron.schedule(
  'transport-cleanup-weekly',
  '0 0 * * 0',                           -- Every Sunday at 00:00 UTC (05:30 IST)
  'SELECT run_transport_cleanup_auto()'  -- Respects the cleanup_paused toggle
);
*/

-- ───────────────────────────────────────────────────────────
-- 9. Per-route ride logs
--    Morning and afternoon are separate journeys on the same day.
--    Add route_id column, drop the old (child_id, date) unique
--    constraint, and add the new (child_id, date, route_id) one.
-- ───────────────────────────────────────────────────────────

ALTER TABLE ride_logs ADD COLUMN IF NOT EXISTS route_id TEXT NOT NULL DEFAULT 'route_morning';

-- Drop old unique constraint (name may vary — try both common names)
ALTER TABLE ride_logs DROP CONSTRAINT IF EXISTS ride_logs_child_id_date_key;
ALTER TABLE ride_logs DROP CONSTRAINT IF EXISTS ride_logs_child_id_date_route_key;

-- New unique constraint: one log per child per route per day
ALTER TABLE ride_logs ADD CONSTRAINT ride_logs_child_id_date_route_key
  UNIQUE (child_id, date, route_id);

-- Index for fast per-route queries
CREATE INDEX IF NOT EXISTS idx_ride_logs_route ON ride_logs (route_id);
