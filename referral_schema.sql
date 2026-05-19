-- Referral Programme
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS referrals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  referrer_name       TEXT NOT NULL,
  referee_name        TEXT NOT NULL,
  referee_phone       TEXT NOT NULL,
  referee_email       TEXT DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','enrolled','rewarded','not-interested')),
  reward_amount       NUMERIC(10,2) DEFAULT 0,
  reward_given_at     DATE,
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON referrals TO anon;
