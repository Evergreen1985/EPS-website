-- Push notification subscriptions (PWA web push)
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  phone      text,
  role       text default 'parent' check (role in ('parent','teacher','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_push_subs_role  on push_subscriptions(role);
create index if not exists idx_push_subs_phone on push_subscriptions(phone);

alter table push_subscriptions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'push_subscriptions'
    and policyname  = 'allow_all_push_subscriptions'
  ) then
    create policy "allow_all_push_subscriptions"
      on push_subscriptions for all using (true) with check (true);
  end if;
end $$;

grant all on table push_subscriptions to anon, authenticated, service_role;
