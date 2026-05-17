-- ============================================================
-- Programmes table
-- Run this in your Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS programmes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  icon        TEXT DEFAULT '🎓',
  color       TEXT DEFAULT '#178F78',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing programmes
INSERT INTO programmes (slug, label, icon, color, sort_order) VALUES
  ('infant',      'Infant Care',      '👶', '#6366F1', 1),
  ('playgroup',   'Playgroup',        '🎈', '#E8694A', 2),
  ('nursery',     'Nursery',          '🌸', '#F5B829', 3),
  ('jrkg',        'Junior KG',        '📚', '#178F78', 4),
  ('srkg',        'Senior KG',        '🏆', '#4A90D9', 5),
  ('daycare',     'Full-Day Daycare', '🏠', '#9B59B6', 6),
  ('afterschool', 'After-School',     '🌅', '#F39C12', 7)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_programmes" ON programmes FOR ALL USING (true);
GRANT ALL ON programmes TO anon;
