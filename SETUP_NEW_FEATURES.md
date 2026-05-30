# New Features Setup — Knowledge Base, Audio Overviews, Staff Training, RAG AI

## Step 1: Run the SQL migration in Supabase

Go to Supabase Dashboard → SQL Editor → paste and run the file:
`supabase/migrations/002_kb_audio_schema.sql`

This creates:
- `kb_documents` table
- `kb_chunks` table (with full-text search index)
- `audio_overviews` table
- `search_kb_chunks` RPC function

## Step 2: Create the Audio Storage Bucket

In Supabase Dashboard → Storage → New Bucket:
- Name: `audio-overviews`
- Public: YES

## Step 3: Configure Google TTS (optional)

For audio generation to work, add to `.env.local`:
```
GOOGLE_TTS_API_KEY=your_google_cloud_api_key
```
If not set, audio script is saved but MP3 is not generated. The same key as
`GOOGLE_VISION_API_KEY` often works (same GCP project).

## Step 4: Seed Knowledge Base content (recommended)

Log in as admin → Knowledge Base tab → Upload & Process your:
- Fee policy / handbook
- School timings / schedule
- Curriculum overview
- Refund / leave policy
- NEP Foundational Stage summary
- Any SOPs for staff

The RAG system works best with at least 3-4 documents uploaded.

## Feature Map

| Feature | Where it appears | Route |
|---|---|---|
| Knowledge Base (Admin) | Admin Dashboard → 📚 Knowledge Base tab | `/admin` |
| Audio Overviews (Admin) | Admin Dashboard → 🎙️ Audio Overviews tab | `/admin` |
| Ask School AI (Parent) | Parent Dashboard → 💬 Ask AI tab | `/parent-dashboard` |
| Audio Player (Parent) | Parent Dashboard → 🎧 Audio tab | `/parent-dashboard` |
| Staff Training (Teacher) | Teacher Dashboard → 🎓 Training tab | `/teacher-dashboard` |
| Activity Planner | AI Tools (Teacher) → RAG Planner banner | `/ai-tools/teacher/planner` |
| Grounded Milestone | `/api/ai/milestone` now uses RAG | Existing milestone advisor |

## New API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/kb/ingest` | POST | Upload + chunk a document into KB |
| `/api/kb/query` | POST | RAG Q&A (parent or staff) |
| `/api/kb/documents` | GET/PATCH/DELETE | Manage KB docs |
| `/api/kb/quiz` | POST | Generate quiz from KB content |
| `/api/audio/script` | POST | Generate podcast script from content |
| `/api/audio/generate` | POST | Convert script to MP3 (Google TTS) |
| `/api/audio/overviews` | GET/DELETE | List/delete audio files |
| `/api/ai/activity` | POST | RAG-backed activity planner |
| `/api/ai/milestone` | POST | Updated: now RAG-grounded |
