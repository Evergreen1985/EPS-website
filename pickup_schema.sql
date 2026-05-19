-- ============================================================
-- Child Pickup Authorization
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS pickup_authorizations (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id      UUID    NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name      TEXT,

  -- Authorized person details
  authorized_name TEXT    NOT NULL,
  relation        TEXT    NOT NULL,   -- parent, grandparent, uncle, aunt, sibling, driver, other
  phone           TEXT    NOT NULL,

  -- ID verification
  id_type         TEXT    DEFAULT 'aadhaar' CHECK (id_type IN ('aadhaar','pan','driving_license','passport','voter_id','other')),
  id_number       TEXT    DEFAULT '',

  -- Status
  is_active       BOOLEAN DEFAULT TRUE,

  -- Audit
  added_by        TEXT,
  notes           TEXT    DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_auth_enquiry ON pickup_authorizations (enquiry_id);

ALTER TABLE pickup_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pickup_auth" ON pickup_authorizations FOR ALL USING (true);
GRANT ALL ON pickup_authorizations TO anon;
