-- ============================================================
-- Owner Portal: New Tables
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Add state column to school_settings (for calendar public holiday loading)
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';


-- 1. Expenses — track school expenses by category
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL CHECK (category IN ('salaries','utilities','maintenance','supplies','repairs','events','other')),
  title       TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  date        DATE NOT NULL,
  added_by    TEXT,
  receipt_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff attendance — clock in/out records per day
CREATE TABLE IF NOT EXISTS staff_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name  TEXT NOT NULL,
  date        DATE NOT NULL,
  clock_in    TIMESTAMPTZ,
  clock_out   TIMESTAMPTZ,
  status      TEXT DEFAULT 'present' CHECK (status IN ('present','absent','half_day','leave')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id, date)
);

-- 3. Owner messages — teacher-to-owner communication
CREATE TABLE IF NOT EXISTS owner_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_teacher_id   UUID,
  from_teacher_name TEXT NOT NULL,
  from_section      TEXT,
  subject           TEXT NOT NULL,
  message           TEXT NOT NULL,
  read_by_owner     BOOLEAN DEFAULT FALSE,
  owner_reply       TEXT,
  replied_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Owner account: Create the owner user in admin_accounts
-- Replace 'owner_username' and the hash with your real values.
-- To generate a bcrypt hash: use https://bcrypt-generator.com
-- or run: node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"
-- ============================================================
INSERT INTO admin_accounts (username, name, role, password_hash, is_active)
VALUES ('owner', 'School Owner', 'owner', '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- RLS Policies (add if RLS is enabled on these tables)
-- ============================================================
ALTER TABLE expenses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_messages   ENABLE ROW LEVEL SECURITY;

-- Permissive policies (service role bypasses RLS anyway)
CREATE POLICY "allow_all_expenses"         ON expenses         FOR ALL USING (true);
CREATE POLICY "allow_all_staff_attendance" ON staff_attendance FOR ALL USING (true);
CREATE POLICY "allow_all_owner_messages"   ON owner_messages   FOR ALL USING (true);

-- ============================================================
-- Staff Roles table (with tab-level permissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#178F78',
  permissions TEXT[] DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add permissions column if upgrading from earlier version
ALTER TABLE staff_roles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_staff_roles" ON staff_roles FOR ALL USING (true);
GRANT ALL ON staff_roles TO anon;

-- ============================================================
-- Required grants for anon key access
-- Run ALL of these in Supabase SQL editor so the cleanup tool
-- (and other owner/admin APIs) can read and delete data.
-- ============================================================
GRANT ALL ON expenses         TO anon;
GRANT ALL ON staff_attendance TO anon;
GRANT ALL ON owner_messages   TO anon;
GRANT ALL ON announcements    TO anon;
GRANT ALL ON homework         TO anon;

-- Cleanup tool — tables that need DELETE permission
GRANT ALL ON fee_assignments  TO anon;
GRANT ALL ON attendance       TO anon;
GRANT ALL ON calendar_events  TO anon;
GRANT ALL ON sections         TO anon;
GRANT ALL ON section_photos   TO anon;
GRANT ALL ON child_documents  TO anon;
GRANT ALL ON child_kit        TO anon;
GRANT ALL ON staff            TO anon;
GRANT ALL ON teacher_accounts TO anon;
GRANT ALL ON parent_accounts  TO anon;
GRANT ALL ON password_resets  TO anon;
GRANT ALL ON enquiries        TO anon;
