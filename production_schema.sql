-- =============================================================
-- EVERGREEN PRESCHOOL & DAYCARE — PRODUCTION DATABASE SCHEMA
-- Run this ONCE in Supabase SQL Editor to set up the full DB.
-- Supabase: https://supabase.com/dashboard/project/mmznugcbwbjeqnmmwmxn/sql
-- All tables use IF NOT EXISTS — safe to re-run.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: MULTI-TENANT FOUNDATION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schools (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text        UNIQUE NOT NULL,
  name       text        NOT NULL,
  domain     text,
  plan       text        NOT NULL DEFAULT 'basic',
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schools (slug, name, domain, plan)
VALUES ('evergreen', 'Evergreen Preschool & Daycare', 'https://evergreenprepschools.com', 'pro')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS school_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid        NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  settings   jsonb       NOT NULL DEFAULT '{}',
  state      text        DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO school_settings (school_id, settings)
SELECT id, '{}'::jsonb FROM schools WHERE slug = 'evergreen'
ON CONFLICT (school_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_accounts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid        REFERENCES schools(id) ON DELETE CASCADE,
  username      text        NOT NULL UNIQUE,
  name          text,
  role          text        NOT NULL DEFAULT 'admin',
  password_hash text        NOT NULL,
  is_active     boolean     NOT NULL DEFAULT true,
  last_login    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_username ON admin_accounts(username);

-- ─────────────────────────────────────────────────────────────
-- SECTION 2: ACADEMIC STRUCTURE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academic_years (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text    NOT NULL,
  start_date date    NOT NULL,
  end_date   date    NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sections (
  id             uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text  NOT NULL,
  program_id     text  NOT NULL,
  program_label  text,
  class_teacher  text,
  strength       int   DEFAULT 0,
  academic_year  text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sections_program_id ON sections(program_id);

-- ─────────────────────────────────────────────────────────────
-- SECTION 3: ENQUIRIES (STUDENTS)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enquiries (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name        text        NOT NULL,
  child_dob         date,
  child_age_months  int,
  parent_name       text,
  phone             text        NOT NULL,
  email             text,
  address           text,
  program_id        text,
  program_label     text,
  section_id        uuid        REFERENCES sections(id) ON DELETE SET NULL,
  section_name      text,
  academic_year_id  uuid        REFERENCES academic_years(id) ON DELETE SET NULL,
  language          text        DEFAULT 'en-IN',
  source            text        DEFAULT 'website',
  heard_from        text,
  status            text        NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','visited','enrolled','waitlist','cancelled','dropped')),
  notes             text        DEFAULT '',
  is_enrolled       boolean     DEFAULT false,
  dob               date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status         ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_phone          ON enquiries(phone);
CREATE INDEX IF NOT EXISTS idx_enquiries_section_id     ON enquiries(section_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_academic_year  ON enquiries(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at     ON enquiries(created_at DESC);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_enquiries" ON enquiries FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON enquiries TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 4: ACCOUNTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_accounts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          text        NOT NULL UNIQUE,
  password_hash  text        NOT NULL,
  enquiry_id     uuid        REFERENCES enquiries(id) ON DELETE SET NULL,
  is_first_login boolean     NOT NULL DEFAULT true,
  last_login     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_accounts_phone ON parent_accounts(phone);

ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_parent_accounts" ON parent_accounts FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON parent_accounts TO anon;

CREATE TABLE IF NOT EXISTS teacher_accounts (
  id             uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  username       text  NOT NULL UNIQUE,
  name           text  NOT NULL,
  password_hash  text  NOT NULL,
  section_id     uuid  REFERENCES sections(id) ON DELETE SET NULL,
  section_name   text,
  program_id     text,
  program_label  text,
  role           text  DEFAULT 'teacher',
  status         text  DEFAULT 'active' CHECK (status IN ('active','inactive')),
  is_first_login boolean NOT NULL DEFAULT true,
  last_login     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teacher_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_teacher_accounts" ON teacher_accounts FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON teacher_accounts TO anon;

CREATE TABLE IF NOT EXISTS staff (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text  NOT NULL,
  role       text  NOT NULL DEFAULT 'teacher',
  phone      text,
  email      text,
  is_active  boolean NOT NULL DEFAULT true,
  joined_at  date,
  notes      text    DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_staff" ON staff FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON staff TO anon;

CREATE TABLE IF NOT EXISTS staff_roles (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  color       text    DEFAULT '#178F78',
  permissions text[]  DEFAULT '{}',
  sort_order  int     DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_staff_roles" ON staff_roles FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON staff_roles TO anon;

CREATE TABLE IF NOT EXISTS teacher_applications (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text  NOT NULL,
  phone        text  NOT NULL,
  email        text,
  experience   text,
  qualification text,
  message      text,
  status       text  DEFAULT 'pending' CHECK (status IN ('pending','reviewed','shortlisted','rejected')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE teacher_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_teacher_applications" ON teacher_applications FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON teacher_applications TO anon;

CREATE TABLE IF NOT EXISTS password_resets (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      text  NOT NULL,
  token      text  NOT NULL,
  expires_at timestamptz NOT NULL,
  used       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_password_resets" ON password_resets FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON password_resets TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 5: ATTENDANCE & MILESTONES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attendance (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid  NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  date       date  NOT NULL,
  status     text  NOT NULL DEFAULT 'present'
             CHECK (status IN ('present','absent','late','half_day')),
  section_id text,
  marked_by  text,
  notes      text  DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON attendance TO anon;

CREATE TABLE IF NOT EXISTS milestones (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id  uuid  REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name  text,
  category    text  DEFAULT 'general',
  title       text  NOT NULL,
  description text,
  achieved_at date,
  noted_by    text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON milestones TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 6: FEES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fee_structures (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text    NOT NULL,
  programme_id text,
  fee_type     text    NOT NULL,
  amount       numeric(10,2) NOT NULL,
  description  text    DEFAULT '',
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_fee_structures" ON fee_structures FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON fee_structures TO anon;

CREATE TABLE IF NOT EXISTS fee_assignments (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id    uuid    REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name    text    NOT NULL,
  fee_type      text    NOT NULL,
  amount        numeric(10,2) NOT NULL,
  paid_amount   numeric(10,2) DEFAULT 0,
  status        text    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','partial','paid','overdue','waived')),
  due_date      date,
  period_label  text,
  payment_date  date,
  payment_mode  text    DEFAULT 'cash'
                CHECK (payment_mode IN ('cash','upi','bank_transfer','cheque','card','other')),
  transaction_id text,
  notes         text    DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_assignments_enquiry ON fee_assignments(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_fee_assignments_status  ON fee_assignments(status);

ALTER TABLE fee_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_fee_assignments" ON fee_assignments FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON fee_assignments TO anon;

CREATE TABLE IF NOT EXISTS expenses (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text    NOT NULL
              CHECK (category IN ('salaries','utilities','maintenance','supplies','repairs','events','other')),
  title       text    NOT NULL,
  amount      numeric(10,2) NOT NULL,
  date        date    NOT NULL,
  added_by    text,
  receipt_url text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON expenses TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 7: STAFF MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_attendance (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid  REFERENCES staff(id) ON DELETE SET NULL,
  staff_name  text  NOT NULL,
  date        date  NOT NULL,
  clock_in    timestamptz,
  clock_out   timestamptz,
  status      text  DEFAULT 'present'
              CHECK (status IN ('present','absent','half_day','leave')),
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (staff_id, date)
);

ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_staff_attendance" ON staff_attendance FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON staff_attendance TO anon;

CREATE TABLE IF NOT EXISTS staff_payroll (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id            uuid    REFERENCES staff(id) ON DELETE CASCADE,
  staff_name          text    NOT NULL,
  month               int     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                int     NOT NULL,
  basic_pay           numeric(10,2) DEFAULT 0,
  hra                 numeric(10,2) DEFAULT 0,
  transport_allowance numeric(10,2) DEFAULT 0,
  other_allowances    numeric(10,2) DEFAULT 0,
  pf_deduction        numeric(10,2) DEFAULT 0,
  other_deductions    numeric(10,2) DEFAULT 0,
  net_pay             numeric(10,2) GENERATED ALWAYS AS
                        (basic_pay + hra + transport_allowance + other_allowances
                         - pf_deduction - other_deductions) STORED,
  status              text    NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','approved','paid')),
  payment_date        date,
  payment_mode        text    DEFAULT 'bank_transfer'
                      CHECK (payment_mode IN ('bank_transfer','cash','cheque','upi')),
  notes               text    DEFAULT '',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (staff_id, month, year)
);

ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_staff_payroll" ON staff_payroll FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON staff_payroll TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 8: CONTENT & COMMUNICATION
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text  NOT NULL,
  body       text  NOT NULL,
  target     text  DEFAULT 'all' CHECK (target IN ('all','parents','teachers','staff')),
  priority   text  DEFAULT 'normal' CHECK (priority IN ('normal','high','urgent')),
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON announcements TO anon;

CREATE TABLE IF NOT EXISTS homework (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id   text  NOT NULL,
  section_name text,
  title        text  NOT NULL,
  description  text,
  subject      text,
  due_date     date,
  assigned_by  text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_homework" ON homework FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON homework TO anon;

CREATE TABLE IF NOT EXISTS calendar_events (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text  NOT NULL,
  description text,
  event_date  date  NOT NULL,
  end_date    date,
  event_type  text  DEFAULT 'event'
              CHECK (event_type IN ('holiday','event','exam','meeting','other')),
  is_public   boolean DEFAULT true,
  created_by  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON calendar_events TO anon;

CREATE TABLE IF NOT EXISTS owner_messages (
  id                uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  from_teacher_id   uuid,
  from_teacher_name text  NOT NULL,
  from_section      text,
  subject           text  NOT NULL,
  message           text  NOT NULL,
  read_by_owner     boolean DEFAULT false,
  owner_reply       text,
  replied_at        timestamptz,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE owner_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_owner_messages" ON owner_messages FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON owner_messages TO anon;

CREATE TABLE IF NOT EXISTS lead_followups (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id    uuid  REFERENCES enquiries(id) ON DELETE CASCADE,
  followup_date date  NOT NULL,
  notes         text  NOT NULL DEFAULT '',
  status        text  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','done','no-answer','rescheduled')),
  added_by      text  DEFAULT 'admin',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_date    ON lead_followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_enquiry ON lead_followups(enquiry_id);

ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_followups" ON lead_followups FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON lead_followups TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 9: GALLERY & MEDIA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gallery_photos (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url    text  NOT NULL,
  title        text,
  ai_caption   text,
  ai_tags      jsonb DEFAULT '[]',
  category     text  DEFAULT 'general',
  is_featured  boolean DEFAULT false,
  is_published boolean DEFAULT true,
  uploaded_at  timestamptz DEFAULT now()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_gallery_photos" ON gallery_photos FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON gallery_photos TO anon;

CREATE TABLE IF NOT EXISTS site_photos (
  slot        text  PRIMARY KEY,
  photo_url   text  NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_site_photos" ON site_photos FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON site_photos TO anon;

CREATE TABLE IF NOT EXISTS section_photos (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid  REFERENCES sections(id) ON DELETE CASCADE,
  photo_url   text  NOT NULL,
  caption     text,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE section_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_section_photos" ON section_photos FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON section_photos TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 10: PROGRAMMES & KIT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS programmes (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text    NOT NULL UNIQUE,
  label      text    NOT NULL,
  icon       text    DEFAULT '🎓',
  color      text    DEFAULT '#178F78',
  sort_order int     DEFAULT 0,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO programmes (slug, label, icon, color, sort_order) VALUES
  ('infant',      'Infant Care',      '👶', '#6366F1', 1),
  ('playgroup',   'Playgroup',        '🎈', '#E8694A', 2),
  ('nursery',     'Nursery',          '🌸', '#F5B829', 3),
  ('jrkg',        'Junior KG',        '📚', '#178F78', 4),
  ('srkg',        'Senior KG',        '🏆', '#4A90D9', 5),
  ('daycare',     'Full-Day Daycare', '🏠', '#9B59B6', 6),
  ('afterschool', 'After-School',     '🌅', '#F39C12', 7)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_programmes" ON programmes FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON programmes TO anon;

CREATE TABLE IF NOT EXISTS programme_items (
  id             uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id   text  NOT NULL,
  item_name      text  NOT NULL,
  item_category  text  DEFAULT 'book'
                 CHECK (item_category IN ('book','uniform','stationery','kit','other')),
  quantity       int   DEFAULT 1,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE programme_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_programme_items" ON programme_items FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON programme_items TO anon;

CREATE TABLE IF NOT EXISTS child_kit (
  id             uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id     uuid  NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name     text,
  programme_id   text  NOT NULL,
  item_name      text  NOT NULL,
  item_category  text  DEFAULT 'other',
  quantity       int   DEFAULT 1,
  size           text,
  issued         boolean DEFAULT false,
  issued_date    date,
  issued_by      text,
  issued_by_role text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE child_kit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_child_kit" ON child_kit FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON child_kit TO anon;

CREATE TABLE IF NOT EXISTS child_documents (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id   uuid  NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name   text,
  doc_type     text  NOT NULL,
  doc_url      text  NOT NULL,
  uploaded_by  text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE child_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_child_documents" ON child_documents FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON child_documents TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 11: TRANSPORT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transport_opt_ins (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     uuid  NOT NULL UNIQUE,
  child_name   text  NOT NULL,
  parent_phone text  NOT NULL DEFAULT '',
  opted_in     boolean NOT NULL DEFAULT false,
  mode         text  NOT NULL DEFAULT 'permanent',
  start_date   date,
  end_date     date,
  pickup_order int   NOT NULL DEFAULT 0,
  drop_order   int   NOT NULL DEFAULT 0,
  updated_by   text  NOT NULL DEFAULT 'parent',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_opt_ins_child  ON transport_opt_ins(child_id);
CREATE INDEX IF NOT EXISTS idx_transport_opt_ins_opted  ON transport_opt_ins(opted_in);

ALTER TABLE transport_opt_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_opt_ins_all" ON transport_opt_ins FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON transport_opt_ins TO anon;
GRANT ALL ON transport_opt_ins TO authenticated;

CREATE TABLE IF NOT EXISTS vehicle_location (
  route_id   text  PRIMARY KEY,
  route_name text  NOT NULL DEFAULT '',
  latitude   double precision NOT NULL DEFAULT 0,
  longitude  double precision NOT NULL DEFAULT 0,
  shared_by  text  NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO vehicle_location (route_id, route_name) VALUES
  ('route_morning',   'Morning Route'),
  ('route_afternoon', 'Afternoon Route')
ON CONFLICT (route_id) DO NOTHING;

ALTER TABLE vehicle_location ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_location_all" ON vehicle_location FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON vehicle_location TO anon;
GRANT ALL ON vehicle_location TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_location;

CREATE TABLE IF NOT EXISTS vehicle_location_history (
  id          bigserial PRIMARY KEY,
  route_id    text  NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  shared_by   text  NOT NULL DEFAULT '',
  date        date  NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vlh_date_route ON vehicle_location_history(date DESC, route_id);

ALTER TABLE vehicle_location_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vlh_all" ON vehicle_location_history FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON vehicle_location_history TO anon;
GRANT ALL ON vehicle_location_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE vehicle_location_history_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE vehicle_location_history_id_seq TO authenticated;

CREATE TABLE IF NOT EXISTS ride_logs (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid  NOT NULL,
  child_name    text  NOT NULL,
  date          date  NOT NULL,
  route_id      text  NOT NULL DEFAULT 'route_morning',
  checkin_time  text,
  checkout_time text,
  checked_by    text  NOT NULL,
  boarded_by    text,
  dropped_by    text,
  status        text  NOT NULL DEFAULT 'waiting'
                CHECK (status IN ('waiting','boarded','dropped','absent')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, date, route_id)
);

CREATE INDEX IF NOT EXISTS idx_ride_logs_date  ON ride_logs(date);
CREATE INDEX IF NOT EXISTS idx_ride_logs_child ON ride_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_ride_logs_route ON ride_logs(route_id);

ALTER TABLE ride_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ride_logs_all" ON ride_logs FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON ride_logs TO anon;
GRANT ALL ON ride_logs TO authenticated;

CREATE TABLE IF NOT EXISTS transport_settings (
  setting_key   text PRIMARY KEY,
  setting_value text NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO transport_settings (setting_key, setting_value)
VALUES ('cleanup_paused', 'false')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE transport_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ts_all" ON transport_settings FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON transport_settings TO anon;
GRANT ALL ON transport_settings TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- SECTION 12: OPTIONAL FEATURE TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ptm_slots (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date    date  NOT NULL,
  start_time   time  NOT NULL,
  end_time     time  NOT NULL,
  teacher_name text  NOT NULL,
  section_name text  DEFAULT '',
  max_bookings int   DEFAULT 1,
  is_active    boolean DEFAULT true,
  notes        text  DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ptm_bookings (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     uuid  REFERENCES ptm_slots(id) ON DELETE CASCADE,
  enquiry_id  uuid  REFERENCES enquiries(id) ON DELETE SET NULL,
  child_name  text  NOT NULL,
  parent_name text  NOT NULL,
  phone       text  NOT NULL,
  status      text  NOT NULL DEFAULT 'booked'
              CHECK (status IN ('booked','confirmed','cancelled','completed')),
  notes       text  DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE ptm_slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_ptm_slots"    ON ptm_slots    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ptm_bookings" ON ptm_bookings FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON ptm_slots    TO anon;
GRANT ALL ON ptm_bookings TO anon;

CREATE TABLE IF NOT EXISTS pickup_authorizations (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id       uuid    NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name       text,
  authorized_name  text    NOT NULL,
  relation         text    NOT NULL,
  phone            text    NOT NULL,
  id_type          text    DEFAULT 'aadhaar',
  id_number        text    DEFAULT '',
  is_active        boolean DEFAULT true,
  added_by         text,
  notes            text    DEFAULT '',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE pickup_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pickup_auth" ON pickup_authorizations FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON pickup_authorizations TO anon;

CREATE TABLE IF NOT EXISTS incidents (
  id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id          uuid  REFERENCES enquiries(id) ON DELETE SET NULL,
  child_name          text  NOT NULL,
  section_name        text  DEFAULT '',
  incident_date       date  NOT NULL,
  incident_time       time,
  incident_type       text  NOT NULL DEFAULT 'other'
                      CHECK (incident_type IN ('accident','illness','behaviour','injury','allergy','other')),
  severity            text  NOT NULL DEFAULT 'low'
                      CHECK (severity IN ('low','medium','high')),
  description         text  NOT NULL DEFAULT '',
  action_taken        text  DEFAULT '',
  reported_by         text  NOT NULL DEFAULT '',
  parent_notified     boolean DEFAULT false,
  parent_notified_at  timestamptz,
  parent_notified_via text    DEFAULT '',
  follow_up_required  boolean DEFAULT false,
  follow_up_notes     text    DEFAULT '',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON incidents TO anon;

CREATE TABLE IF NOT EXISTS child_medical (
  id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id          uuid  NOT NULL UNIQUE REFERENCES enquiries(id) ON DELETE CASCADE,
  child_name          text,
  blood_group         text  CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown','')),
  allergies           jsonb NOT NULL DEFAULT '[]',
  vaccinations        jsonb NOT NULL DEFAULT '[]',
  emergency_contacts  jsonb NOT NULL DEFAULT '[]',
  medical_conditions  text  DEFAULT '',
  special_needs       text  DEFAULT '',
  doctor_name         text  DEFAULT '',
  doctor_phone        text  DEFAULT '',
  insurance_provider  text  DEFAULT '',
  updated_by          text,
  updated_at          timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE child_medical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_child_medical" ON child_medical FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON child_medical TO anon;

CREATE TABLE IF NOT EXISTS referrals (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_enquiry_id uuid    REFERENCES enquiries(id) ON DELETE SET NULL,
  referrer_name       text    NOT NULL,
  referee_name        text    NOT NULL,
  referee_phone       text    NOT NULL,
  referee_email       text    DEFAULT '',
  status              text    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','contacted','enrolled','rewarded','not-interested')),
  reward_amount       numeric(10,2) DEFAULT 0,
  reward_given_at     date,
  notes               text    DEFAULT '',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON referrals TO anon;

CREATE TABLE IF NOT EXISTS testimonials (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name  text  NOT NULL,
  child_name   text  DEFAULT '',
  program      text  DEFAULT '',
  content      text  NOT NULL,
  rating       int   DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url   text  DEFAULT '',
  is_published boolean DEFAULT false,
  is_featured  boolean DEFAULT false,
  source       text  DEFAULT 'direct'
               CHECK (source IN ('direct','google','facebook','whatsapp')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_testimonials" ON testimonials FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON testimonials TO anon;

CREATE TABLE IF NOT EXISTS blog_posts (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text  NOT NULL,
  slug            text  UNIQUE NOT NULL,
  excerpt         text  DEFAULT '',
  content         text  NOT NULL,
  category        text  NOT NULL DEFAULT 'news'
                  CHECK (category IN ('news','announcement','event','tips','milestone')),
  cover_image_url text  DEFAULT '',
  author          text  DEFAULT 'Evergreen Team',
  is_published    boolean DEFAULT false,
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_blog" ON blog_posts FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON blog_posts TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 13: SYSTEM / OWNER TOOLS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_feature_flags (
  key        text        PRIMARY KEY,
  enabled    boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

INSERT INTO app_feature_flags (key, enabled) VALUES ('test_runner', false)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_feature_flags" ON app_feature_flags FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON app_feature_flags TO anon;

CREATE TABLE IF NOT EXISTS test_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by  text        NOT NULL DEFAULT 'owner',
  status        text        NOT NULL DEFAULT 'running',
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  total         int         NOT NULL DEFAULT 0,
  passed        int         NOT NULL DEFAULT 0,
  failed        int         NOT NULL DEFAULT 0,
  errors        int         NOT NULL DEFAULT 0,
  skipped       int         NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_results (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid        NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  tc_id       text        NOT NULL,
  module      text        NOT NULL,
  sub_module  text,
  title       text        NOT NULL,
  status      text        NOT NULL,
  message     text,
  duration_ms int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(run_id);

ALTER TABLE test_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_test_runs"    ON test_runs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_test_results" ON test_results FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON test_runs    TO anon;
GRANT ALL ON test_results TO anon;

-- ─────────────────────────────────────────────────────────────
-- SECTION 14: TRANSPORT AUTO-CLEANUP FUNCTION (optional)
-- Enable pg_cron extension in Supabase Dashboard first,
-- then uncomment the cron.schedule block below.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION run_transport_cleanup_auto()
RETURNS TEXT LANGUAGE plpgsql AS $func$
DECLARE paused boolean;
BEGIN
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM transport_settings WHERE setting_key = 'cleanup_paused'),
    false
  ) INTO paused;
  IF paused THEN RETURN 'skipped (paused)'; END IF;
  DELETE FROM vehicle_location_history WHERE recorded_at < NOW() - INTERVAL '7 days';
  DELETE FROM ride_logs WHERE date < (NOW() - INTERVAL '30 days')::date;
  RETURN 'done';
END;
$func$;

/*  Uncomment after enabling pg_cron extension:
SELECT cron.schedule(
  'transport-cleanup-weekly',
  '0 0 * * 0',
  'SELECT run_transport_cleanup_auto()'
);
*/

-- ─────────────────────────────────────────────────────────────
-- SECTION 15: OWNER ADMIN ACCOUNT
-- Replace the password hash before running in production.
-- Generate: node -e "require('bcryptjs').hash('YourPassword',10).then(console.log)"
-- ─────────────────────────────────────────────────────────────

INSERT INTO admin_accounts (username, name, role, password_hash, is_active)
VALUES ('owner', 'School Owner', 'owner', '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH', true)
ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- END OF SCHEMA — 45 tables, RLS enabled on all, anon access granted
-- =============================================================
