-- ─────────────────────────────────────────────────────────────────────────────
-- community_chat_schema.sql
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CHANNELS (4 fixed groups) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_channels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  description text,
  icon        text        NOT NULL DEFAULT '💬',
  access      text        NOT NULL DEFAULT 'all', -- 'all','parents','staff','parents_staff'
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO community_channels (slug, name, description, icon, access, sort_order) VALUES
  ('children',  'Children''s Corner', 'A fun space for kids to share, create and play!',          '🌟', 'parents_staff', 1),
  ('parents',   'Parent Circle',      'Connect, share tips and support each other.',               '👨‍👩‍👧', 'parents',        2),
  ('staff',     'Staff Room',         'Internal discussions for our dedicated teaching team.',     '👩‍🏫', 'staff',          3),
  ('community', 'Community Board',    'Open to everyone — alumni, prospects and friends!',        '🌍', 'all',            4)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. MEMBERS (one row per person per channel — holds their display label) ──

CREATE TABLE IF NOT EXISTS channel_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   uuid        NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
  user_type    text        NOT NULL,  -- 'parent','teacher','owner','community'
  user_ref     text        NOT NULL,  -- phone / username / localStorage uuid
  display_name text        NOT NULL,
  avatar_emoji text        NOT NULL DEFAULT '😊',
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_type, user_ref)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user    ON channel_members(user_type, user_ref);

-- ── 3. MESSAGES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   uuid        NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
  member_id    uuid        NOT NULL REFERENCES channel_members(id)    ON DELETE CASCADE,
  display_name text        NOT NULL,
  user_type    text        NOT NULL,
  avatar_emoji text        NOT NULL DEFAULT '😊',
  content      text,
  msg_type     text        NOT NULL DEFAULT 'text',  -- 'text','ai_image'
  image_url    text,
  is_deleted   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON community_messages(channel_id, created_at DESC);

-- ── 4. REACTIONS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_reactions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid        NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  member_id  uuid        NOT NULL REFERENCES channel_members(id)    ON DELETE CASCADE,
  emoji      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, member_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);

-- ── 5. PERMISSIONS ───────────────────────────────────────────────────────────

GRANT ALL ON community_channels  TO anon;
GRANT ALL ON channel_members     TO anon;
GRANT ALL ON community_messages  TO anon;
GRANT ALL ON message_reactions   TO anon;

-- ── 6. REALTIME ──────────────────────────────────────────────────────────────

ALTER TABLE community_messages REPLICA IDENTITY FULL;
ALTER TABLE message_reactions  REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
