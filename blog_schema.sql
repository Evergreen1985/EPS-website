-- Blog / News Section
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  excerpt         TEXT DEFAULT '',
  content         TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'news' CHECK (category IN ('news','announcement','event','tips','milestone')),
  cover_image_url TEXT DEFAULT '',
  author          TEXT DEFAULT 'Evergreen Team',
  is_published    BOOLEAN DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_blog" ON blog_posts FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON blog_posts TO anon;
