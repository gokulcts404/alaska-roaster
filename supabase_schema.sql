-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

-- 1. Generic key-value store: holds team members, scheduling conditions,
--    and per-month overrides/adhoc logs as JSON. Simple = one table,
--    no schema changes needed as the app evolves.
create table if not exists kv_store (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. Append-only audit trail (PIN changes, logins, etc). Optional but
--    recommended for a "who changed what" trail beyond the in-app log.
create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  event_type  text not null,
  member_name text,
  detail      text,
  created_at  timestamptz not null default now()
);

-- 3. Row Level Security
-- This is an internal team tool that does its own PIN-based login inside
-- the app (not Supabase Auth), so we use the public "anon" key and allow
-- it full access to these two tables. Anyone with the anon key (i.e.
-- anyone who can load the app) can read/write this data -- that's an
-- acceptable tradeoff for a small internal roster tool, but do NOT reuse
-- this anon key/project for anything containing sensitive data.
alter table kv_store enable row level security;
alter table audit_log enable row level security;

create policy "anon full access kv_store" on kv_store
  for all using (true) with check (true);

create policy "anon full access audit_log" on audit_log
  for all using (true) with check (true);
