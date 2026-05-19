-- ══════════════════════════════════════════════════════════════
-- TEST RUNNER SCHEMA
-- Run this in Supabase SQL Editor ONCE before using Test Runner
-- ══════════════════════════════════════════════════════════════

-- Table: stores each test run session
CREATE TABLE IF NOT EXISTS test_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total        INTEGER DEFAULT 0,
  passed       INTEGER DEFAULT 0,
  failed       INTEGER DEFAULT 0,
  errors       INTEGER DEFAULT 0,
  skipped      INTEGER DEFAULT 0,
  triggered_by TEXT DEFAULT 'owner',
  status       TEXT DEFAULT 'running'  -- 'running' | 'completed' | 'aborted'
);

-- Table: individual test case results per run
CREATE TABLE IF NOT EXISTS test_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  tc_id       TEXT NOT NULL,
  module      TEXT NOT NULL,
  sub_module  TEXT,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL,           -- 'pass' | 'fail' | 'error' | 'skip'
  message     TEXT,                    -- error message or pass detail
  duration_ms INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: plug-in/unplug toggle for test runner
CREATE TABLE IF NOT EXISTS app_feature_flags (
  key        TEXT PRIMARY KEY,
  enabled    BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Insert test_runner flag (disabled by default)
INSERT INTO app_feature_flags (key, enabled)
VALUES ('test_runner', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status  ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_started_at ON test_runs(started_at DESC);

-- RLS (open for anon — owner portal uses anon key)
ALTER TABLE test_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_runs_all"    ON test_runs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "test_results_all" ON test_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "flags_all"        ON app_feature_flags FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON test_runs, test_results, app_feature_flags TO anon;
