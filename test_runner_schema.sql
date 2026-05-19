-- ─────────────────────────────────────────────────────────────────────────────
-- test_runner_schema.sql
-- Tables required by the Owner Test Runner feature
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/mmznugcbwbjeqnmmwmxn/sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. FEATURE FLAGS ─────────────────────────────────────────────────────────
-- Controls which features are enabled/disabled from the Owner Portal.

CREATE TABLE IF NOT EXISTS app_feature_flags (
  key         text        PRIMARY KEY,
  enabled     boolean     NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

-- Seed the test_runner flag (disabled by default — owner must explicitly enable)
INSERT INTO app_feature_flags (key, enabled)
VALUES ('test_runner', false)
ON CONFLICT (key) DO NOTHING;

-- ── 2. TEST RUNS ─────────────────────────────────────────────────────────────
-- One row per test execution session started from the Owner Portal.

CREATE TABLE IF NOT EXISTS test_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by  text        NOT NULL DEFAULT 'owner',
  status        text        NOT NULL DEFAULT 'running',  -- 'running' | 'completed' | 'aborted'
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  total         int         NOT NULL DEFAULT 0,
  passed        int         NOT NULL DEFAULT 0,
  failed        int         NOT NULL DEFAULT 0,
  errors        int         NOT NULL DEFAULT 0,
  skipped       int         NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_test_runs_started_at ON test_runs (started_at DESC);

-- ── 3. TEST RESULTS ──────────────────────────────────────────────────────────
-- One row per individual test case result, linked to a test run.

CREATE TABLE IF NOT EXISTS test_results (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid        NOT NULL REFERENCES test_runs (id) ON DELETE CASCADE,
  tc_id       text        NOT NULL,
  module      text        NOT NULL,
  sub_module  text,
  title       text        NOT NULL,
  status      text        NOT NULL,  -- 'pass' | 'fail' | 'error' | 'skip'
  message     text,
  duration_ms int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results (run_id);
