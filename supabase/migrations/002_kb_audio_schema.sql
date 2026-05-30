-- ══════════════════════════════════════════════════════════════
-- Knowledge Base + Audio Overviews Schema
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Knowledge base documents (handbooks, policies, SOPs, etc.)
create table if not exists kb_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  file_url    text,
  file_name   text,
  target      text default 'parent' check (target in ('parent','staff','both')),
  doc_type    text default 'other'
    check (doc_type in ('handbook','policy','curriculum','sop','guidelines','faq','ncf','other')),
  uploaded_by text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Chunks for full-text retrieval (RAG)
create table if not exists kb_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references kb_documents(id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  created_at  timestamptz default now()
);

create index if not exists idx_kb_chunks_tsv      on kb_chunks using gin(content_tsv);
create index if not exists idx_kb_chunks_doc      on kb_chunks(document_id);
create index if not exists idx_kb_documents_target on kb_documents(target, is_active);

-- Audio overviews
create table if not exists audio_overviews (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  source_type      text default 'custom' check (source_type in ('announcement','document','custom')),
  source_id        uuid,
  script           text,
  audio_url        text,
  duration_seconds integer,
  status           text default 'pending' check (status in ('pending','generating','ready','failed')),
  created_by       text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- RLS (same permissive pattern as the rest of the project)
alter table kb_documents   enable row level security;
alter table kb_chunks      enable row level security;
alter table audio_overviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='kb_documents'    and policyname='allow_all_kb_documents')    then create policy "allow_all_kb_documents"    on kb_documents    for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='kb_chunks'       and policyname='allow_all_kb_chunks')       then create policy "allow_all_kb_chunks"       on kb_chunks       for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='audio_overviews' and policyname='allow_all_audio_overviews') then create policy "allow_all_audio_overviews" on audio_overviews for all using (true) with check (true); end if;
end $$;

-- Full-text search RPC used by lib/rag.ts
create or replace function search_kb_chunks(
  query_text    text,
  target_filter text default 'parent',
  limit_count   integer default 5
)
returns table (
  id             uuid,
  content        text,
  document_id    uuid,
  document_title text,
  doc_type       text,
  rank           real
)
language plpgsql as $$
begin
  return query
    select
      kc.id,
      kc.content,
      kc.document_id,
      kd.title  as document_title,
      kd.doc_type,
      ts_rank(kc.content_tsv, plainto_tsquery('english', query_text)) as rank
    from kb_chunks kc
    join kb_documents kd on kd.id = kc.document_id
    where kd.is_active = true
      and (kd.target = target_filter or kd.target = 'both' or target_filter = 'both')
      and kc.content_tsv @@ plainto_tsquery('english', query_text)
    order by rank desc
    limit limit_count;
end;
$$;

-- PostgREST role grants (required for API access via anon/authenticated/service_role)
grant usage on schema public to anon, authenticated, service_role;
grant all on table kb_documents    to anon, authenticated, service_role;
grant all on table kb_chunks       to anon, authenticated, service_role;
grant all on table audio_overviews to anon, authenticated, service_role;
grant execute on function search_kb_chunks(text, text, integer) to anon, authenticated, service_role;

-- Supabase Storage bucket for audio files
-- Run manually in Supabase Dashboard > Storage if not using CLI:
-- insert into storage.buckets (id, name, public) values ('audio-overviews', 'audio-overviews', true)
-- on conflict do nothing;
