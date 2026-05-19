-- Lead Follow-Up / Waiting List
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS lead_followups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id    UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  followup_date DATE NOT NULL,
  notes         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','no-answer','rescheduled')),
  added_by      TEXT DEFAULT 'admin',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for fast date-based queries
CREATE INDEX IF NOT EXISTS idx_followups_date ON lead_followups (followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_enquiry ON lead_followups (enquiry_id);

ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_followups" ON lead_followups FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON lead_followups TO anon;
