-- =============================================================================
-- Minimal stand-ins for what Supabase provides, so the real migrations can run
-- on plain Postgres (PGlite) in tests. Not a migration; never applied to Supabase.
--
-- The migrations must give the same access with Supabase's "grant API access to
-- new tables automatically" setting on or off. The tests prove both.
-- =============================================================================

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- auth: users table + auth.uid() reading the JWT subject, as PostgREST sets it.
create schema auth;
create table auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase always grants schema usage. Whether new tables are also granted
-- automatically is a project setting; the harness switches it (see harness.ts).
grant usage on schema public to anon, authenticated, service_role;

-- storage: just enough of the schema for bucket rows and object policies.
create schema storage;
create table storage.buckets (
  id                  text primary key,
  name                text not null unique,
  public              boolean not null default false,
  file_size_limit     bigint,
  allowed_mime_types  text[],
  created_at          timestamptz not null default now()
);
create table storage.objects (
  id          uuid primary key default gen_random_uuid(),
  bucket_id   text references storage.buckets (id),
  name        text not null,
  owner       uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  unique (bucket_id, name)
);
alter table storage.objects enable row level security;

-- Same behaviour as Supabase's storage.foldername(): the path's folders, without the file name.
create function storage.foldername(name text) returns text[]
language plpgsql immutable
as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end
$$;

grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
