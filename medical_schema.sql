-- ============================================================
-- Child Medical Records
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS child_medical (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id          UUID        NOT NULL UNIQUE REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name          TEXT,

  -- Basic health info
  blood_group         TEXT        CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown','')),

  -- JSONB arrays — see formats below
  -- allergies:          [{type: "food"|"medicine"|"environmental"|"other", name: string, severity: "mild"|"moderate"|"severe"}]
  -- vaccinations:       [{name: string, date: string, next_due: string, completed: boolean}]
  -- emergency_contacts: [{name: string, relation: string, phone: string}]
  allergies           JSONB       NOT NULL DEFAULT '[]',
  vaccinations        JSONB       NOT NULL DEFAULT '[]',
  emergency_contacts  JSONB       NOT NULL DEFAULT '[]',

  -- Free-text fields
  medical_conditions  TEXT        DEFAULT '',
  special_needs       TEXT        DEFAULT '',

  -- Doctor / insurance
  doctor_name         TEXT        DEFAULT '',
  doctor_phone        TEXT        DEFAULT '',
  insurance_provider  TEXT        DEFAULT '',

  -- Audit
  updated_by          TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by child
CREATE INDEX IF NOT EXISTS idx_child_medical_enquiry ON child_medical (enquiry_id);

-- RLS
ALTER TABLE child_medical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_child_medical" ON child_medical FOR ALL USING (true);

-- Grant to anon key (same pattern as all other tables)
GRANT ALL ON child_medical TO anon;
