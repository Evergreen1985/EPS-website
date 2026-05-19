-- Testimonials Manager
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS testimonials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name  TEXT NOT NULL,
  child_name   TEXT DEFAULT '',
  program      TEXT DEFAULT '',
  content      TEXT NOT NULL,
  rating       INT  DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url   TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  is_featured  BOOLEAN DEFAULT false,
  source       TEXT DEFAULT 'direct' CHECK (source IN ('direct','google','facebook','whatsapp')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_testimonials" ON testimonials FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON testimonials TO anon;
