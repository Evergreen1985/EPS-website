-- Parent-Teacher Meeting Scheduler
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS ptm_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date    DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  teacher_name TEXT NOT NULL,
  section_name TEXT DEFAULT '',
  max_bookings INT  DEFAULT 1,
  is_active    BOOLEAN DEFAULT true,
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ptm_bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     UUID REFERENCES ptm_slots(id) ON DELETE CASCADE,
  enquiry_id  UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  child_name  TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  phone       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','confirmed','cancelled','completed')),
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ptm_slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_ptm_slots"    ON ptm_slots    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ptm_bookings" ON ptm_bookings FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON ptm_slots    TO anon;
GRANT ALL ON ptm_bookings TO anon;
