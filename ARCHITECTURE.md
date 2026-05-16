# Evergreen Preschool Website — Architecture & Technical Documentation

**School:** Evergreen Preschool & Daycare, Electronic City, Bengaluru  
**Last Updated:** 2026-05-16

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Application Architecture](#4-application-architecture)
5. [Authentication & Session Management](#5-authentication--session-management)
6. [Database Schema](#6-database-schema)
7. [API Routes Reference](#7-api-routes-reference)
8. [Components Reference](#8-components-reference)
9. [External Integrations](#9-external-integrations)
10. [Environment Variables](#10-environment-variables)
11. [Feature Matrix](#11-feature-matrix)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Security Model](#13-security-model)
14. [Deployment Notes](#14-deployment-notes)

---

## 1. Project Overview

Evergreen Preschool Website is a full-stack school management and public-facing web application. It serves three distinct user roles through separate portals, alongside a public marketing website.

### Portals

| Portal | URL | Auth Method | Session Duration |
|--------|-----|-------------|-----------------|
| Admin Dashboard | `/admin` | bcrypt + httpOnly JWT cookie | 8 hours |
| Teacher Dashboard | `/teacher-dashboard` | localStorage JSON | 12 hours |
| Parent Dashboard | `/parent-dashboard` | localStorage JSON | 7 days |
| Public Website | `/`, `/about`, `/programs`, etc. | None | — |

### Core Capabilities

- **School Management:** Enquiry tracking, student profiles, section assignments, academic year rollover
- **Fee Management:** Fee structures, assignments, payment recording, Razorpay online payments, receipts
- **Attendance:** Daily marking, history with date-range filter, CSV export
- **Homework:** Assignment creation by teachers, mark-done by parents
- **Documents:** Upload, OCR extraction via Claude Vision, admin verification workflow
- **Photos:** Section photo gallery, AI tagging, face detection
- **Kit Management:** Per-programme kit templates, per-child checklist, bulk issue
- **Staff Management:** CRUD staff records, bulk Excel import
- **Announcements:** Admin broadcasts to parents/teachers/all with urgency levels
- **AI Features:** Claude Vision for document OCR and photo tagging; Google Vision for face detection

---

## 2. Technology Stack

### Core Framework

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.5 |
| Language | TypeScript | 5.0 |
| Styling | Tailwind CSS | 3.4 |
| Runtime | Node.js | 18+ |

### Backend & Database

| Service | Purpose |
|---------|---------|
| Supabase (PostgreSQL) | Primary database — all persistent data |
| Supabase Storage | File storage — documents, photos, profile images |
| Supabase RLS | Row-level security policies on all tables |

### Authentication Libraries

| Library | Version | Use |
|---------|---------|-----|
| bcryptjs | ^3.0.3 | Password hashing (admin, teacher, parent) |
| jose | ^6.2.3 | JWT signing/verification for admin cookie sessions |

### UI & Utilities

| Library | Version | Use |
|---------|---------|-----|
| lucide-react | ^0.460.0 | Icon set throughout the application |
| clsx | ^2.1.1 | Conditional className utility |
| tailwind-merge | ^2.5.0 | Merge Tailwind classes without conflicts |

### File & Data Processing

| Library | Version | Use |
|---------|---------|-----|
| exceljs | ^4.4.0 | Excel template generation and parsing |
| xlsx | ^0.18.5 | Excel import/export (bulk student & staff import) |
| jszip | ^3.10.1 | ZIP file handling |

### External APIs

| API | Purpose |
|-----|---------|
| Anthropic Claude (`claude-opus-4-5-20251101`) | Document OCR, photo AI tagging |
| Google Vision API | Face detection and bounding boxes in photos |
| Google Maps Places API | Fetch school reviews and rating |
| Razorpay | Online fee payment gateway |

### Fonts

| Font | Weights | Usage |
|------|---------|-------|
| Fredoka | 400, 500, 600, 700 | Headings, branding |
| Quicksand | 400, 500, 600, 700 | Body text, UI labels |

---

## 3. Repository Structure

```
C:\Git-EPS\EPS-website\
├── next.config.js                        Next.js configuration
├── package.json                          Dependencies
├── tsconfig.json                         TypeScript configuration
├── postcss.config.js                     PostCSS / Tailwind setup
├── .env.example                          Public env var template
├── .env.local                            Secrets (not in git)
├── TEST_CHECKLIST.txt                    Manual test checklist
│
├── public/
│   ├── logo.png
│   └── (static assets)
│
└── src/
    ├── middleware.ts                     Edge middleware (admin JWT verification)
    │
    ├── lib/
    │   ├── supabase.ts                   Supabase singleton client
    │   └── adminSession.ts              JWT sign/verify helpers (jose)
    │
    ├── app/
    │   ├── layout.tsx                    Root layout — fonts, metadata, Navbar, Footer
    │   ├── globals.css                   Global styles
    │   ├── not-found.tsx                 Custom 404
    │   │
    │   ├── page.tsx                      Homepage
    │   ├── about/page.tsx                About page
    │   ├── admissions/page.tsx           Admissions info
    │   ├── ai-tools/page.tsx             AI tools showcase
    │   ├── contact/page.tsx              Contact page
    │   ├── community/page.tsx            Community & portals
    │   ├── daycare/page.tsx              Daycare programs
    │   ├── enquiry/page.tsx              Public enquiry form
    │   ├── gallery/page.tsx              Photo gallery
    │   ├── programs/page.tsx             Programme details
    │   │
    │   ├── admin-login/page.tsx          Admin login page
    │   ├── teacher-login/page.tsx        Teacher login page
    │   ├── parent-login/page.tsx         Parent login page
    │   ├── forgot-password/page.tsx      Password reset
    │   ├── parent-portal/page.tsx        Parent portal wrapper
    │   │
    │   ├── admin/page.tsx                Admin dashboard (middleware-protected)
    │   ├── teacher-dashboard/page.tsx    Teacher dashboard
    │   ├── parent-dashboard/page.tsx     Parent dashboard
    │   │
    │   └── api/
    │       ├── config/route.ts           GET — public Supabase config
    │       ├── reviews/route.ts          GET — Google Maps reviews
    │       ├── enquiry/route.ts          POST — public enquiry submission
    │       ├── enquiries/update/route.ts POST — generic enquiry update
    │       ├── settings/route.ts         GET/POST — school settings
    │       ├── academic-years/route.ts   CRUD + rollover
    │       ├── staff/route.ts            CRUD staff
    │       ├── ocr/route.ts              POST — Claude Vision OCR
    │       │
    │       ├── admin/
    │       │   ├── login/route.ts        POST — admin authentication
    │       │   ├── logout/route.ts       POST — admin logout
    │       │   ├── me/route.ts           GET — current admin session
    │       │   ├── enquiries/route.ts    GET/PATCH — enquiry management
    │       │   ├── sections/route.ts     CRUD — class sections
    │       │   ├── calendar/route.ts     CRUD — calendar events
    │       │   └── announcements/route.ts CRUD — announcements
    │       │
    │       ├── auth/
    │       │   ├── parent-login/route.ts POST — parent authentication
    │       │   ├── reset-password/route.ts POST — OTP generation
    │       │   └── verify-otp/route.ts   POST — OTP verification + password update
    │       │
    │       ├── teacher/
    │       │   ├── login/route.ts        POST — teacher authentication
    │       │   ├── dashboard/route.ts    GET — teacher dashboard data
    │       │   ├── attendance/route.ts   GET/POST — attendance
    │       │   └── homework/route.ts     POST/DELETE — homework
    │       │
    │       ├── fees/
    │       │   ├── structures/route.ts   CRUD — fee structures
    │       │   ├── assignments/route.ts  CRUD — fee assignments
    │       │   ├── record-payment/route.ts POST — cash/offline payment
    │       │   ├── pay/route.ts          POST/PATCH — Razorpay online payment
    │       │   ├── reports/route.ts      GET — monthly fee reports
    │       │   └── history/route.ts      GET — per-child payment history
    │       │
    │       ├── kit/
    │       │   ├── route.ts              CRUD — kit items
    │       │   └── bulk/route.ts         POST — bulk kit operations
    │       │
    │       ├── documents/
    │       │   ├── route.ts              GET/POST/PATCH — child documents
    │       │   └── pending/route.ts      GET — pending document queue
    │       │
    │       ├── photos/
    │       │   ├── upload/route.ts       POST — save photo metadata
    │       │   ├── detect-faces/route.ts POST/PATCH — Google Vision face detection
    │       │   ├── ai-tag/route.ts       POST — Claude photo analysis
    │       │   ├── face-match/route.ts   POST — search photos by child name
    │       │   └── profile/route.ts      POST — update child profile photo
    │       │
    │       ├── import/
    │       │   ├── students/route.ts     POST — bulk Excel student import
    │       │   └── staff/route.ts        POST — bulk Excel staff import
    │       │
    │       └── parent/
    │           └── dashboard/route.ts    GET — parent dashboard data
    │
    └── components/
        ├── Navbar.tsx
        ├── Footer.tsx
        ├── FooterWrapper.tsx
        ├── WhatsAppButton.tsx
        ├── HeroPill.tsx
        ├── GoogleReviews.tsx
        ├── FeesTab.tsx
        ├── SchoolSettingsTab.tsx
        ├── AcademicYearTab.tsx
        ├── StaffTab.tsx
        ├── ExcelImport.tsx
        ├── KitBulkManager.tsx
        ├── TeacherKitTab.tsx
        ├── KitChecklist.tsx
        ├── PhotoUploader.tsx
        ├── FaceAutoTagger.tsx
        ├── DocumentManager.tsx
        ├── DocumentOCR.tsx
        ├── ParentDocumentsTab.tsx
        └── ChildEditModal.tsx
```

---

## 4. Application Architecture

### Next.js App Router

The application uses the Next.js 14 App Router exclusively. All routes are defined via the filesystem under `src/app/`. Server Components are the default; Client Components are marked with `"use client"` where interactivity is needed (dashboards, forms, modals).

### Request Flow — Admin Routes

```
Browser
  └─► Edge Middleware (src/middleware.ts)
        └─► Verify ep_admin_sid cookie (jose JWT)
              ├── Valid   → Pass request to Next.js handler
              └── Invalid → Redirect to /admin-login
```

### Request Flow — Teacher / Parent Routes

```
Browser
  └─► Page renders (Client Component)
        └─► Read localStorage (ep_teacher_session / ep_parent_session)
              ├── Valid + not expired → Show dashboard
              └── Missing / expired  → Redirect to login page
```

### Supabase Client Initialization

Two client instances are used:

| Instance | File | Key Used | Used In |
|----------|------|----------|---------|
| Client-side | `src/lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser components (photo upload, kit checklist) |
| Server-side | Inline in each API route | `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` | All `/api/*` route handlers |

Server-side routes create a fresh Supabase client per request:

```typescript
function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           || process.env.SUPABASE_ANON_KEY
           || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}
```

### Admin Dashboard Tab Architecture

The admin dashboard (`src/app/admin/page.tsx`) is a single-page application with tab-based navigation. All state lives in a single Client Component.

**Tab type union:**
```typescript
type AdminTab =
  | "enquiries" | "sections" | "calendar" | "photos"
  | "fees" | "staff" | "settings" | "academic"
  | "import" | "kit" | "announcements";
```

Each tab renders a dedicated component or inline JSX block. Data is fetched on tab switch via `useEffect` + `useCallback`.

### next.config.js

```javascript
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};
```

> **Note:** `ignoreBuildErrors: true` suppresses pre-existing TypeScript errors at build time. Known pre-existing errors are documented in `memory/preexisting-ts-errors.md`.

---

## 5. Authentication & Session Management

### Admin Authentication (Cookie-based JWT)

**Login flow:**
1. POST `/api/admin/login` with `{ username, password }`
2. Server looks up `admin_accounts` table, verifies bcrypt hash
3. On success, signs a JWT: `{ username, name, role }` with `SESSION_SECRET` (HS256, 8-hour expiry)
4. Sets `ep_admin_sid` cookie: `httpOnly=true`, `secure=true` (prod), `sameSite=strict`

**Verification flow:**
- Edge middleware intercepts all `/admin/*` and `/api/admin/*` requests
- Reads `ep_admin_sid` cookie, verifies JWT with `jose`
- Invalid/expired → 302 redirect to `/admin-login`
- Valid → forwards request, sets `x-admin-name` header for downstream handlers

**Logout:**
- POST `/api/admin/logout` — clears the cookie, returns 200

**admin_accounts table columns:**
```
id, username, name, role, password_hash, is_active, last_login, created_at
```

---

### Teacher Authentication (localStorage)

**Login flow:**
1. POST `/api/teacher/login` with `{ username, password }`
2. Server verifies bcrypt hash in `teacher_accounts`
3. Returns session payload (no cookie set)
4. Client stores in `localStorage` key `ep_teacher_session`

**Session payload:**
```json
{
  "id": "uuid",
  "name": "Teacher Name",
  "username": "teacher1",
  "sectionId": "uuid",
  "sectionName": "Nursery A",
  "programId": "nursery",
  "programLabel": "Nursery",
  "role": "teacher",
  "loginTime": 1716000000000
}
```

**Expiry:** Client checks `Date.now() - loginTime > 12 * 60 * 60 * 1000` on every dashboard mount.

---

### Parent Authentication (localStorage)

**Login modes (POST `/api/auth/parent-login`):**

| Action | Trigger | Logic |
|--------|---------|-------|
| `create` | First-ever login | Validates phone + DOB + last 4 digits of phone; creates `parent_accounts` row; sets initial password |
| `first-login` | Has account, never set custom password | Returns temporary credentials |
| `login` | Normal login | Verifies bcrypt hash |

**Initial password format:** `Initial(uppercase) + YearOfBirth + Last4DigitsOfPhone`  
Example: child name "Arjun", DOB 2021, phone ends 5678 → `A20215678`

**Session payload:**
```json
{
  "phone": "9876543210",
  "childName": "Arjun Kumar",
  "studentId": "EP-001",
  "enquiryId": "uuid",
  "loginTime": 1716000000000
}
```

**Expiry:** 7 days (client-side check).

**Password Reset flow:**
1. POST `/api/auth/reset-password` — generates OTP, stores in `password_resets` table
2. OTP sent via WhatsApp link
3. POST `/api/auth/verify-otp` — validates OTP, updates password hash in `parent_accounts` or `teacher_accounts`

---

## 6. Database Schema

All tables are in the `public` schema. RLS is enabled on all tables with permissive `using (true)` policies (access control is enforced at the API layer, not DB layer).

---

### enquiries
Primary student/child record.

```sql
create table enquiries (
  id                uuid primary key default gen_random_uuid(),
  child_name        text not null,
  child_dob         date,
  child_age_months  integer,
  phone             text,
  parent_name       text,
  father_name       text,
  mother_name       text,
  email             text,
  address           text,
  blood_group       text,
  allergies         text,
  program_id        text,
  program_label     text,
  section_id        uuid references sections(id),
  section_name      text,
  academic_year_id  uuid references academic_years(id),
  status            text default 'new',   -- new | enrolled | waitlist | cancelled
  photo_url         text,
  notes             text,
  lang              text default 'en-IN',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

---

### sections
Class sections within a programme.

```sql
create table sections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  program_id  text not null,
  created_at  timestamptz default now()
);
```

---

### academic_years
School year management.

```sql
create table academic_years (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,        -- e.g. "2025-26"
  start_date  date,
  end_date    date,
  is_current  boolean default false,
  created_at  timestamptz default now()
);
```

---

### admin_accounts

```sql
create table admin_accounts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  name          text not null,
  role          text default 'admin',
  password_hash text not null,
  is_active     boolean default true,
  last_login    timestamptz,
  created_at    timestamptz default now()
);
```

---

### teacher_accounts

```sql
create table teacher_accounts (
  id             uuid primary key default gen_random_uuid(),
  username       text unique not null,
  name           text not null,
  password_hash  text not null,
  section_id     uuid references sections(id),
  section_name   text,
  program_id     text,
  program_label  text,
  role           text default 'teacher',
  status         text default 'active',
  last_login     timestamptz,
  created_at     timestamptz default now()
);
```

---

### parent_accounts

```sql
create table parent_accounts (
  id              uuid primary key default gen_random_uuid(),
  phone           text unique not null,
  child_name      text,
  child_dob       date,
  student_id      text,
  enquiry_id      uuid references enquiries(id),
  password_hash   text,
  is_first_login  boolean default true,
  last_login      timestamptz,
  created_at      timestamptz default now()
);
```

---

### password_resets

```sql
create table password_resets (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  role        text not null,   -- 'parent' | 'teacher'
  otp         text not null,
  expires_at  timestamptz not null,
  used        boolean default false,
  created_at  timestamptz default now()
);
```

---

### fee_structures

```sql
create table fee_structures (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  programme_id  text,
  fee_type      text,
  amount        numeric not null,
  description   text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);
```

---

### fee_assignments
Links a fee structure to a child. One row per fee per child.

```sql
create table fee_assignments (
  id                uuid primary key default gen_random_uuid(),
  enquiry_id        uuid references enquiries(id),
  child_name        text,
  fee_structure_id  uuid references fee_structures(id),
  fee_type          text,
  amount            numeric,
  due_date          date,
  period_label      text,
  status            text default 'pending',  -- pending | paid | partial | waived | overdue
  receipt_no        text,
  receipt_number    text,
  payment_id        text,           -- Razorpay payment ID
  payment_date      date,
  payment_mode      text,           -- cash | cheque | bank_transfer | upi | razorpay
  paid_amount       numeric,
  paid_at           timestamptz,
  received_by       text,
  reference_number  text,
  discount_amount   numeric default 0,
  discount_reason   text,
  notes             text,
  reminder_sent_at  timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

**Required Supabase RPC function:**
```sql
create or replace function generate_receipt_number()
returns text language plpgsql as $$
declare
  seq int;
  yr  text := to_char(now(), 'YY');
begin
  select coalesce(max(
    nullif(regexp_replace(receipt_number, '[^0-9]', '', 'g'), '')::int
  ), 0) + 1
  into seq
  from fee_assignments
  where receipt_number like 'RCP' || yr || '%';
  return 'RCP' || yr || lpad(seq::text, 4, '0');
end;
$$;
```

---

### attendance

```sql
create table attendance (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid references enquiries(id),
  date           date not null,
  status         text not null,   -- present | absent | late
  check_in_time  text,
  check_out_time text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (student_id, date)       -- required for upsert
);
```

---

### homework

```sql
create table homework (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid references sections(id),
  section_name  text,
  title         text not null,
  description   text,
  due_date      date,
  subject       text,
  assigned_by   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

---

### announcements

```sql
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  target      text default 'all',     -- all | parents | teachers
  priority    text default 'normal',  -- normal | urgent
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

---

### calendar_events

```sql
create table calendar_events (
  id           uuid primary key default gen_random_uuid(),
  event_date   date not null,
  event_type   text,    -- holiday | festival | activity | exam | ptm | sports
  title        text not null,
  description  text,
  color        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

---

### staff

```sql
create table staff (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  role              text,
  phone             text,
  email             text,
  dob               date,
  join_date         date,
  last_working_day  date,
  address           text,
  notes             text,
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

---

### school_settings
Single-row configuration table (id = 'main').

```sql
create table school_settings (
  id           text primary key default 'main',
  school_name  text,
  trust_name   text,
  address      text,
  phone        text,
  email        text,
  logo_url     text,
  pan_number   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

---

### programme_items
Kit item templates per programme.

```sql
create table programme_items (
  id              uuid primary key default gen_random_uuid(),
  programme_id    text not null,
  item_name       text not null,
  item_category   text,
  quantity        integer default 1,
  notes           text,
  is_active       boolean default true,
  sort_order      integer default 0,
  created_at      timestamptz default now()
);
```

---

### child_kit
Per-child kit checklist (instantiated from programme_items template).

```sql
create table child_kit (
  id                      uuid primary key default gen_random_uuid(),
  enquiry_id              uuid references enquiries(id),
  child_name              text,
  programme_id            text,
  academic_year_id        uuid references academic_years(id),
  programme_item_id       uuid references programme_items(id),
  item_name               text not null,
  item_category           text,
  quantity                integer default 1,
  issued                  boolean default false,
  issued_date             date,
  issued_by               text,
  issued_by_role          text,
  parent_comment          text,
  parent_acknowledged     boolean default false,
  parent_acknowledged_at  timestamptz,
  school_notes            text,
  size                    text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);
```

---

### section_photos

```sql
create table section_photos (
  id               uuid primary key default gen_random_uuid(),
  section_id       uuid references sections(id),
  section_name     text,
  title            text,
  photo_url        text not null,
  uploaded_by      text,
  uploaded_by_role text,
  is_featured      boolean default false,
  ai_caption       text,
  ai_tags          jsonb,    -- [{index, childName, confidence, x, y, w, h}]
  uploaded_at      timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
```

---

### child_documents

```sql
create table child_documents (
  id                uuid primary key default gen_random_uuid(),
  enquiry_id        uuid references enquiries(id) on delete cascade,
  child_name        text,
  document_type     text not null,   -- birth_certificate | aadhaar | passport | vaccination | photo | other
  document_label    text,
  file_url          text not null,
  file_name         text,
  file_size         bigint,
  mime_type         text,
  uploaded_by       text default 'parent',   -- parent | admin | teacher
  uploaded_by_name  text,
  status            text default 'pending'   -- pending | verified | rejected
    check (status in ('pending', 'verified', 'rejected')),
  verified_by       text,
  verified_at       timestamptz,
  rejection_reason  text,
  ocr_data          jsonb,    -- {child_name, child_dob, father_name, mother_name, address, gender, blood_group}
  ocr_applied       boolean default false,
  created_at        timestamptz default now()
);

create index idx_child_documents_enquiry on child_documents(enquiry_id);
create index idx_child_documents_status  on child_documents(status);
```

---

### RLS Policies (Applied to All Tables)

```sql
-- Pattern applied to every table
alter table public.<table_name> enable row level security;

create policy "allow_all_<table_name>"
  on public.<table_name>
  for all
  using (true)
  with check (true);
```

Access control is enforced at the API route layer (middleware JWT verification), not at the database layer.

---

## 7. API Routes Reference

### Authentication

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/admin/login` | None | Admin username/password → JWT cookie |
| POST | `/api/admin/logout` | Cookie | Clear admin session cookie |
| GET | `/api/admin/me` | Cookie | Return current admin name + role |
| POST | `/api/teacher/login` | None | Teacher login → session payload |
| POST | `/api/auth/parent-login` | None | Parent login (create / first-login / login) |
| POST | `/api/auth/reset-password` | None | Generate OTP for phone |
| POST | `/api/auth/verify-otp` | None | Verify OTP → update password |

### Admin — Enquiries & Students

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/enquiries` | List all enquiries |
| PATCH | `/api/admin/enquiries` | Update status, section, notes |
| POST | `/api/enquiries/update` | Generic field update (nullifies empty strings) |
| POST | `/api/import/students` | Bulk Excel import |

### Admin — Sections & Calendar

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST/PATCH/DELETE | `/api/admin/sections` | CRUD class sections |
| GET/POST/PATCH/DELETE | `/api/admin/calendar` | CRUD calendar events (filter by `?month=YYYY-MM`) |

### Admin — Announcements

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/announcements` | List all announcements |
| POST | `/api/admin/announcements` | Create announcement |
| PATCH | `/api/admin/announcements` | Update by id |
| DELETE | `/api/admin/announcements` | Delete by id |

### Academic Year

| Method | Route | Action | Description |
|--------|-------|--------|-------------|
| GET | `/api/academic-years` | — | List all years |
| POST | `/api/academic-years` | — | Create year |
| PATCH | `/api/academic-years` | `set_current` | Mark year as current |
| PATCH | `/api/academic-years` | `rollover` | Move all enrolled children to new year |
| PATCH | `/api/academic-years` | `rollover_selected` | Move specific children |
| PATCH | `/api/academic-years` | `bulk_status` | Update status for multiple children |
| PATCH | `/api/academic-years` | `bulk_section` | Assign section to multiple children |

### Fees

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST/PATCH/DELETE | `/api/fees/structures` | CRUD fee structures |
| GET/POST/PATCH | `/api/fees/assignments` | Manage fee assignments per child |
| POST | `/api/fees/record-payment` | Record cash/offline payment |
| POST/PATCH | `/api/fees/pay` | Razorpay: create order / verify signature |
| GET | `/api/fees/reports` | Monthly fee summary + overdue list |
| GET | `/api/fees/history` | Payment history for one child (`?enquiryId=`) |

### Teacher

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/teacher/dashboard` | Children, attendance, homework, photos for section |
| GET | `/api/teacher/attendance` | Attendance history with date range (`?sectionId=&from=&to=`) |
| POST | `/api/teacher/attendance` | Upsert today's attendance |
| POST | `/api/teacher/homework` | Create homework assignment |
| DELETE | `/api/teacher/homework` | Delete homework |

### Staff

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/staff` | List all staff |
| POST | `/api/staff` | Create or update staff record |
| DELETE | `/api/staff` | Remove staff record |
| POST | `/api/import/staff` | Bulk Excel import |

### Kit Management

| Method | Route | Action | Description |
|--------|-------|--------|-------------|
| GET | `/api/kit` | — | Kit items by `?enquiryId=` or `?programmeId=` |
| POST | `/api/kit` | `init` | Create kit from programme template |
| POST | `/api/kit` | `add` | Add custom item to child |
| POST | `/api/kit` | `add_template` | Add item to programme template |
| PATCH | `/api/kit` | `issue` | Mark item as issued |
| PATCH | `/api/kit` | `unissue` | Unmark item |
| PATCH | `/api/kit` | `parent_comment` | Save parent comment |
| PATCH | `/api/kit` | `acknowledge` | Parent acknowledges receipt |
| PATCH | `/api/kit` | `update_notes` | Update school notes + size |
| POST | `/api/kit/bulk` | `status` | Kit status for multiple children |
| POST | `/api/kit/bulk` | `init_bulk` | Init kit for multiple children |
| POST | `/api/kit/bulk` | `issue_bulk` | Bulk issue by category |

### Documents

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/documents` | All documents for a child (`?enquiryId=`) |
| POST | `/api/documents` | Save document record after storage upload |
| PATCH | `/api/documents` | Verify / reject / save OCR (`action=verify|reject|save_ocr`) |
| GET | `/api/documents/pending` | All pending docs across all children |
| POST | `/api/ocr` | Claude Vision OCR — extract fields from document image |

### Photos

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/photos/upload` | Save photo metadata after storage upload |
| POST | `/api/photos/detect-faces` | Google Vision face detection |
| PATCH | `/api/photos/detect-faces` | Save face tags |
| POST | `/api/photos/ai-tag` | Claude Vision photo analysis + tagging |
| POST | `/api/photos/face-match` | Search photos by child name |
| POST | `/api/photos/profile` | Update child profile photo |

### Parent Portal

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/parent/dashboard` | Child info, announcements, homework, calendar, photos |

### Public / Shared

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/enquiry` | Public enquiry form submission |
| GET | `/api/reviews` | Google Maps school reviews |
| GET | `/api/config` | Public Supabase URL + anon key |
| GET/POST | `/api/settings` | School settings (admin-protected write) |

---

## 8. Components Reference

### Layout Components

| Component | Description |
|-----------|-------------|
| `Navbar.tsx` | Top navigation bar with links to all public pages |
| `Footer.tsx` | Site footer with contact info and links |
| `FooterWrapper.tsx` | Conditionally hides footer on dashboard pages |
| `WhatsAppButton.tsx` | Floating WhatsApp chat button |
| `HeroPill.tsx` | Hero section pill/badge component |
| `GoogleReviews.tsx` | Carousel of Google Maps reviews |

### Admin Dashboard Tabs

| Component | Props | Description |
|-----------|-------|-------------|
| `FeesTab.tsx` | `enquiries: any[]` | Complete fee management: structures, assignments, payments, receipts, reports |
| `SchoolSettingsTab.tsx` | — | Edit school name, address, logo, PAN |
| `AcademicYearTab.tsx` | — | Create/manage years, rollover students |
| `StaffTab.tsx` | — | CRUD staff records |
| `ExcelImport.tsx` | `onImported: () => void` | Bulk import students or staff from Excel |
| `KitBulkManager.tsx` | — | Bulk kit init and issue for multiple children |

### Teacher Features

| Component | Props | Description |
|-----------|-------|-------------|
| `TeacherKitTab.tsx` | `sectionChildren: Child[]`, `teacherName: string` | Kit checklist for teacher — mark items as issued |
| `PhotoUploader.tsx` | `onPhotoUploaded: (url) => void` | Upload photo to Supabase Storage |
| `FaceAutoTagger.tsx` | `photoId`, `photoUrl`, `sectionChildren` | AI face detection + auto-tag children in photo |

### Document Management

| Component | Props | Description |
|-----------|-------|-------------|
| `DocumentManager.tsx` | `enquiryId`, `childName`, `mode: "admin"/"parent"`, `uploadedBy`, `supabase`, `onOcrApply?` | Upload, view, verify/reject documents; OCR integration |
| `DocumentOCR.tsx` | `onExtracted: (fields) => void` | Claude Vision scan — extract child/parent info from document |
| `ParentDocumentsTab.tsx` | `child`, `supabase`, `parentName` | Parent-facing wrapper around DocumentManager |

### Kit & Checklist

| Component | Props | Description |
|-----------|-------|-------------|
| `KitChecklist.tsx` | `enquiryId`, `childName`, `programmeId`, `mode`, `issuedBy` | Per-child kit checklist — mark issued, parent acknowledgment |

### Modals

| Component | Props | Description |
|-----------|-------|-------------|
| `ChildEditModal.tsx` | `child`, `onSave: () => void` | Edit child details with optional OCR auto-fill |

---

## 9. External Integrations

### Anthropic Claude Vision

- **Model:** `claude-opus-4-5-20251101`
- **Used in:** `/api/ocr` (document extraction), `/api/photos/ai-tag` (photo analysis)
- **OCR output fields:** `child_name`, `child_dob`, `father_name`, `mother_name`, `address`, `gender`, `blood_group`, `document_type`
- **Photo tagging output:** `caption`, `activity`, `detected_children_count`, `mood`, `tags[]`
- **Input:** Base64-encoded image or PDF
- **Key:** `ANTHROPIC_API_KEY`

### Google Vision API

- **Used in:** `/api/photos/detect-faces`
- **Output:** Face bounding boxes `[{index, x, y, w, h}]`
- **Key:** `GOOGLE_VISION_API_KEY`

### Google Maps Places API

- **Used in:** `/api/reviews`
- **Output:** School name, rating, reviews with author, text, photo, timestamp
- **Config:** `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACE_ID`

### Razorpay

- **Used in:** `/api/fees/pay` + client-side in parent dashboard
- **Flow:** Server creates order → Client loads Razorpay checkout → Client receives `payment_id` + `signature` → Server verifies signature → Updates `fee_assignments` status
- **Keys:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

### Supabase Storage

- **Buckets used:**
  - `section-photos` — Teacher-uploaded classroom photos
  - `child-documents` — Parent/admin uploaded child documents (birth cert, aadhaar, etc.)
  - `profile-photos` — Child profile pictures
- **Upload pattern:** Client uploads directly to Supabase Storage using anon key, then POSTs the returned URL to the API route to save metadata

---

## 10. Environment Variables

### Required for Core Operation

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_URL` | Server-side Supabase URL |
| `SUPABASE_ANON_KEY` | Server-side anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS — keep secret) |
| `SESSION_SECRET` | JWT signing secret for admin sessions (≥32 characters) |

### Required for AI Features

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude Vision API key (OCR + photo tagging) |
| `GOOGLE_VISION_API_KEY` | Google Vision API key (face detection) |

### Required for Reviews & Maps

| Variable | Description |
|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `GOOGLE_PLACE_ID` | School's Google Place ID |

### Required for Payments

| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OpenGraph |
| `NEXT_PUBLIC_FORMSPREE_ID` | Formspree endpoint for contact form |
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID |

---

## 11. Feature Matrix

| Feature | Admin | Teacher | Parent | Public |
|---------|-------|---------|--------|--------|
| View enquiries | ✅ Full CRUD | — | — | Submit only |
| Manage sections | ✅ | — | — | — |
| Academic year rollover | ✅ | — | — | — |
| Fee structures | ✅ | — | — | — |
| Record payment | ✅ | — | — | — |
| Pay fees online | — | — | ✅ (Razorpay) | — |
| View payment history | ✅ | — | ✅ (own child) | — |
| Fee reminders (WhatsApp) | ✅ | — | — | — |
| Mark attendance | — | ✅ | — | — |
| View attendance history | ✅ | ✅ + CSV export | — | — |
| Create homework | — | ✅ | — | — |
| Mark homework done | — | — | ✅ (localStorage) | — |
| Upload photos | — | ✅ | — | — |
| AI photo tagging | — | ✅ | — | — |
| View gallery | ✅ | ✅ | ✅ | ✅ (public) |
| Upload documents | ✅ | — | ✅ | — |
| Verify documents | ✅ | — | — | — |
| OCR document scan | ✅ | — | ✅ | — |
| Kit management | ✅ Bulk | ✅ Issue items | ✅ View + acknowledge | — |
| Announcements | ✅ Full CRUD | View | View | — |
| Manage staff | ✅ | — | — | — |
| School settings | ✅ | — | — | — |
| Bulk Excel import | ✅ | — | — | — |
| Calendar | ✅ | View | View | — |
| Password reset | — | ✅ (OTP) | ✅ (OTP) | — |

---

## 12. Data Flow Diagrams

### Enquiry Submission (Public Website)

```
User fills contact form (homepage)
  └─► POST /api/enquiry
        └─► Insert into enquiries (status: 'new')
              └─► Admin sees in Enquiries tab
                    └─► Admin updates status → enrolled
                          └─► PATCH /api/admin/enquiries
```

### Fee Payment (Online)

```
Parent clicks Pay → Parent Dashboard
  └─► POST /api/fees/pay (create Razorpay order)
        └─► Razorpay Checkout Modal (client-side)
              └─► User pays → Razorpay returns {payment_id, signature}
                    └─► PATCH /api/fees/pay (verify signature)
                          └─► Update fee_assignments status → 'paid'
```

### Document OCR Flow

```
Parent/Admin uploads document file
  └─► Supabase Storage (direct upload from browser)
        └─► POST /api/documents (save metadata, status: 'pending')
              └─► Optional: POST /api/ocr (base64 → Claude Vision)
                    └─► Returns {child_name, child_dob, ...}
                          └─► Admin reviews → PATCH /api/documents (action: verify/reject)
```

### Attendance History Export

```
Teacher opens Attendance History
  └─► GET /api/teacher/attendance?sectionId=&from=&to=
        └─► Fetch enquiries in section
              └─► Fetch attendance records for those IDs in date range
                    └─► Return {attendance[], children[]}
                          └─► Teacher Dashboard renders grouped by date
                                └─► Click Export CSV → browser downloads file
```

---

## 13. Security Model

### What is Protected

| Resource | Protection Method |
|----------|-----------------|
| `/admin/*` pages | Edge middleware rejects requests without valid JWT cookie |
| `/api/admin/*` routes | Edge middleware rejects requests without valid JWT cookie |
| Teacher API calls | Routes check for teacher session in request headers (per-route) |
| Parent API calls | Routes use phone number from request body (no server-side session) |
| Supabase DB | RLS enabled (permissive policies — protection at API layer) |
| Admin passwords | bcrypt with salt rounds |
| Teacher passwords | bcrypt with salt rounds |
| Parent passwords | bcrypt with salt rounds |
| Admin JWT | httpOnly cookie (not accessible from JavaScript), 8-hour TTL |

### Known Limitations

1. **Teacher & Parent routes are not middleware-protected.** A direct API call to `/api/teacher/attendance` with a valid `sectionId` would succeed without authentication. Mitigation: data is not sensitive enough to require enforcement at this stage; upgrade path is to add JWT middleware for teacher/parent routes.

2. **Parent dashboard exposes enquiry data by enquiry ID.** The `/api/parent/dashboard` route uses a phone number, which limits cross-user access, but enquiry IDs stored in localStorage could theoretically be guessed.

3. **`ignoreBuildErrors: true` in next.config.js** means TypeScript errors do not block deployment. Pre-existing errors should be reviewed before production hardening.

4. **`/api/config`** exposes the Supabase anon key publicly. This is intentional (it is a public key by design) but should be monitored.

---

## 14. Deployment Notes

### Build

```bash
npm run build    # Production build
npm run dev      # Development server (localhost:3000)
npm run start    # Start production server
```

### Recommended Hosting

**Vercel** (optimal for Next.js App Router):
- Connect GitHub repository → auto-deploy on push to `main`
- Set all environment variables in Vercel project settings
- Edge middleware runs natively on Vercel Edge Network

### Supabase Setup Checklist

Before first deployment, ensure the following exist in Supabase:

- [ ] All 19 tables created with correct columns
- [ ] RLS enabled + permissive policy on every table
- [ ] `generate_receipt_number()` RPC function created
- [ ] Storage buckets: `section-photos`, `child-documents`, `profile-photos` (set to public)
- [ ] At least one `admin_accounts` row inserted (password must be bcrypt-hashed)
- [ ] At least one `academic_years` row with `is_current = true`
- [ ] `school_settings` row with `id = 'main'` inserted

### Health Check SQL

Run in Supabase SQL Editor to verify all tables exist:

```sql
select table_name,
       case when table_name in (
         select table_name from information_schema.tables
         where table_schema = 'public'
       ) then 'EXISTS' else 'MISSING' end as status
from (values
  ('enquiries'), ('sections'), ('calendar_events'), ('announcements'),
  ('attendance'), ('homework'), ('section_photos'), ('fee_assignments'),
  ('fee_structures'), ('staff'), ('academic_years'), ('child_kit'),
  ('programme_items'), ('child_documents'), ('admin_accounts'),
  ('teacher_accounts'), ('parent_accounts'), ('password_resets'),
  ('school_settings')
) as t(table_name)
order by table_name;
```

---

*Document generated from codebase analysis — 2026-05-16*
