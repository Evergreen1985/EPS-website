-- ─────────────────────────────────────────────────────────────────────────────
-- community_reports_schema.sql
-- Report/Block support for the community chat (Google Play UGC policy).
-- Run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_reports (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id         uuid,        -- community_messages.id (kept even if message later deleted)
  channel_id         uuid,        -- community_channels.id
  reported_member_id uuid,        -- channel_members.id of the author being reported
  reported_name      text,        -- author display name (snapshot)
  reported_content   text,        -- message text (snapshot, for admin review)
  reporter_type      text,        -- 'parent' | 'teacher' | 'owner' | 'admin'
  reporter_ref       text,        -- reporter phone / username
  reporter_name      text,        -- reporter display name
  status             text        NOT NULL DEFAULT 'open',  -- 'open' | 'reviewed' | 'actioned' | 'dismissed'
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_reports_status  ON community_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reports_message ON community_reports(message_id);

-- Mobile app uses the Supabase anon key (same as the rest of the community tables).
GRANT ALL ON community_reports TO anon;
