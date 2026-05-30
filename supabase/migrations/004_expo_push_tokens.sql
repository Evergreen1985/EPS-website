create table if not exists expo_push_tokens (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  token       text not null,
  platform    text not null default 'android',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (token)
);

create index if not exists expo_push_tokens_phone_idx on expo_push_tokens (phone);
