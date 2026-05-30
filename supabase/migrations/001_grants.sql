-- ══════════════════════════════════════════════════════════════
-- PostgREST Role Grants — run ONCE per new Supabase project
-- Covers all existing tables and auto-grants all future tables
-- ══════════════════════════════════════════════════════════════

-- Schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- All existing tables, sequences, functions
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Auto-grant for every table/sequence/function created in the future
-- (this is what makes new-school setup zero-friction)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
