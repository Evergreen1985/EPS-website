-- Incident / Accident Log
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS incidents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id          UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  child_name          TEXT NOT NULL,
  section_name        TEXT DEFAULT '',
  incident_date       DATE NOT NULL,
  incident_time       TIME,
  incident_type       TEXT NOT NULL DEFAULT 'other' CHECK (incident_type IN ('accident','illness','behaviour','injury','allergy','other')),
  severity            TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
  description         TEXT NOT NULL DEFAULT '',
  action_taken        TEXT DEFAULT '',
  reported_by         TEXT NOT NULL DEFAULT '',
  parent_notified     BOOLEAN DEFAULT false,
  parent_notified_at  TIMESTAMPTZ,
  parent_notified_via TEXT DEFAULT '' CHECK (parent_notified_via IN ('','phone','whatsapp','in-person','email')),
  follow_up_required  BOOLEAN DEFAULT false,
  follow_up_notes     TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON incidents TO anon;
