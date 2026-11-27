-- =============================================================================
-- ODEVELLE core schema
-- Tables, constraints, indexes and integrity triggers. Access control lives in
-- the next migration (RLS); public reads in the one after.
--
-- Mirrors in the app (kept in sync by unit tests):
--   enums            → src/invitation/schema/identity.ts, media.ts
--   slug format      → src/lib/tenant/slug.ts
--   reserved slugs   → src/lib/tenant/reserved.ts
--   media rules      → src/invitation/schema/media.ts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.invitation_status as enum ('draft', 'published', 'archived');
create type public.package_tier      as enum ('classic', 'signature', 'exclusive');
create type public.occasion          as enum ('wedding', 'engagement', 'birthday', 'anniversary', 'baptism', 'confirmation', 'other');
create type public.access_mode       as enum ('unlisted', 'passcode');
create type public.media_kind        as enum ('hero', 'gallery', 'illustration', 'audio', 'video', 'og');
create type public.user_role         as enum ('admin', 'client');

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds the role. Two roles only.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'client',
  full_name   text check (char_length(full_name) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- New sign-ups get a 'client' profile. Admins are promoted manually by staff.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- clients: the paying customer (couple, family). May exist before any login.
-- ---------------------------------------------------------------------------
create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid references auth.users (id) on delete set null,
  display_name   text not null check (char_length(display_name) between 1 and 160),
  email          text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone          text check (char_length(phone) <= 40),
  country_code   text check (country_code ~ '^[A-Z]{2}$'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index clients_owner_user_id_idx on public.clients (owner_user_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reserved_slugs: subdomains that can never be an invitation.
-- ---------------------------------------------------------------------------
create table public.reserved_slugs (
  slug text primary key check (slug = lower(slug))
);

insert into public.reserved_slugs (slug) values
  ('www'), ('app'), ('admin'), ('api'), ('dashboard'), ('studio'), ('account'), ('accounts'),
  ('auth'), ('login'), ('signin'), ('signup'), ('billing'), ('checkout'), ('pay'), ('payments'),
  ('mail'), ('email'), ('smtp'), ('imap'), ('pop'), ('mx'), ('autodiscover'), ('autoconfig'),
  ('ns1'), ('ns2'),
  ('static'), ('assets'), ('cdn'), ('media'), ('images'), ('img'), ('files'), ('uploads'), ('storage'),
  ('dev'), ('staging'), ('preview'), ('test'), ('demo'), ('status'), ('docs'), ('help'), ('support'),
  ('blog'), ('shop'), ('store'),
  ('odevelle');

-- ---------------------------------------------------------------------------
-- invitations: identity + design pin + validated JSONB configuration.
-- ---------------------------------------------------------------------------
create table public.invitations (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null,
  client_id         uuid not null references public.clients (id) on delete restrict,
  status            public.invitation_status not null default 'draft',
  package           public.package_tier not null,
  occasion          public.occasion not null default 'wedding',

  -- Guest access. V1 serves 'unlisted' only; 'passcode' is reserved for later.
  access_mode       public.access_mode not null default 'unlisted',
  access_code_hash  text,

  -- Design pin: allowlisted in the app registry; stored, never executed.
  design_id         text not null,
  design_version    integer not null,

  title             text not null,
  locale            text not null default 'en',
  time_zone         text not null,
  primary_date      date,

  -- Validated by the app (Zod, per design version) before every write and read.
  content           jsonb not null default '{}'::jsonb,
  appearance        jsonb not null default '{}'::jsonb,
  design_options    jsonb not null default '{}'::jsonb,
  features          jsonb not null default '{}'::jsonb,

  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint invitations_slug_key unique (slug),
  constraint invitations_slug_format check (
    slug ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$' and position('--' in slug) = 0
  ),
  constraint invitations_design_id_format check (
    design_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(design_id) <= 64
  ),
  constraint invitations_design_version_positive check (design_version > 0),
  constraint invitations_title_length check (char_length(title) between 1 and 160),
  constraint invitations_locale_format check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint invitations_json_objects check (
    jsonb_typeof(content) = 'object'
    and jsonb_typeof(appearance) = 'object'
    and jsonb_typeof(design_options) = 'object'
    and jsonb_typeof(features) = 'object'
  ),
  constraint invitations_passcode_needs_hash check (access_mode <> 'passcode' or access_code_hash is not null),
  constraint invitations_published_has_date check (status <> 'published' or published_at is not null)
);

create index invitations_client_id_idx on public.invitations (client_id);

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- Rejects reserved slugs and unknown time zones; stamps published_at on first publish.
create function public.invitations_validate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'slug "%" is reserved', new.slug using errcode = 'check_violation';
  end if;

  -- Raises invalid_parameter_value for anything Postgres doesn't know as a zone.
  perform now() at time zone new.time_zone;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger invitations_validate
  before insert or update of slug, time_zone, status on public.invitations
  for each row execute function public.invitations_validate();

-- ---------------------------------------------------------------------------
-- invitation_versions: append-only snapshots (history, rollback, revision count).
-- ---------------------------------------------------------------------------
create table public.invitation_versions (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations (id) on delete cascade,
  version        integer not null check (version > 0),
  snapshot       jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  note           text check (char_length(note) <= 500),
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint invitation_versions_invitation_version_key unique (invitation_id, version)
);

-- ---------------------------------------------------------------------------
-- invitation_events: ceremony, reception, roce, mehndi …
-- ---------------------------------------------------------------------------
create table public.invitation_events (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations (id) on delete cascade,
  kind           text not null check (kind ~ '^[a-z]+(-[a-z]+)*$' and char_length(kind) <= 40),
  title          text not null check (char_length(title) between 1 and 160),
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  venue_name     text check (char_length(venue_name) <= 160),
  address        text check (char_length(address) <= 500),
  latitude       numeric(9, 6) check (latitude between -90 and 90),
  longitude      numeric(9, 6) check (longitude between -180 and 180),
  map_url        text check (map_url ~ '^https://' and char_length(map_url) <= 2000),
  dress_code     text check (char_length(dress_code) <= 120),
  notes          text check (char_length(notes) <= 1000),
  rsvp_enabled   boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint invitation_events_time_order check (ends_at is null or ends_at > starts_at),
  constraint invitation_events_location_pair check ((latitude is null) = (longitude is null)),
  -- Target for composite FKs that pin RSVP answers to the same invitation.
  constraint invitation_events_id_invitation_key unique (id, invitation_id)
);

create index invitation_events_invitation_order_idx
  on public.invitation_events (invitation_id, sort_order, starts_at);

create trigger invitation_events_set_updated_at
  before update on public.invitation_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- invitation_media: one row per storage object, scoped to its invitation's folder.
-- ---------------------------------------------------------------------------
create table public.invitation_media (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references public.invitations (id) on delete cascade,
  kind            public.media_kind not null,
  storage_path    text not null,
  mime_type       text not null,
  bytes           bigint not null check (bytes > 0),
  width           integer check (width > 0),
  height          integer check (height > 0),
  duration_ms     integer check (duration_ms >= 0),
  alt             text check (char_length(alt) <= 300),
  blur_data_url   text check (char_length(blur_data_url) <= 2000 and blur_data_url like 'data:image/%'),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint invitation_media_storage_path_key unique (storage_path),
  -- Objects live under "{invitation_id}/…": a row can't point into another tenant's folder.
  constraint invitation_media_path_scoped check (
    storage_path like invitation_id::text || '/%'
    and position('..' in storage_path) = 0
    and char_length(storage_path) <= 512
  ),
  -- Kind ↔ type ↔ size. SVG is excluded on purpose (it can carry script).
  constraint invitation_media_kind_type check (
    (kind in ('hero', 'gallery', 'illustration', 'og')
      and mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
      and bytes <= 15728640)
    or (kind = 'audio'
      and mime_type in ('audio/mpeg', 'audio/mp4', 'audio/aac')
      and bytes <= 15728640)
    or (kind = 'video'
      and mime_type in ('video/mp4', 'video/webm')
      and bytes <= 157286400)
  )
);

create index invitation_media_invitation_kind_order_idx
  on public.invitation_media (invitation_id, kind, sort_order);

create trigger invitation_media_set_updated_at
  before update on public.invitation_media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rsvps: private guest replies. Inserted only through a server-side function
-- (Phase 6), never directly by browsers.
-- ---------------------------------------------------------------------------
create table public.rsvps (
  id               uuid primary key default gen_random_uuid(),
  invitation_id    uuid not null references public.invitations (id) on delete cascade,
  guest_name       text not null check (char_length(btrim(guest_name)) between 1 and 120),
  email            text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone            text check (char_length(phone) <= 40),
  attending        boolean not null,
  party_size       smallint not null default 1 check (party_size between 0 and 20),
  dietary          text check (char_length(dietary) <= 500),
  message          text check (char_length(message) <= 2000),
  -- SHA-256 hex digests. Raw tokens and raw IPs are never stored.
  edit_token_hash  text check (edit_token_hash ~ '^[0-9a-f]{64}$'),
  ip_hash          text check (ip_hash ~ '^[0-9a-f]{64}$'),
  submitted_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint rsvps_declined_has_no_party check (attending or party_size = 0),
  constraint rsvps_id_invitation_key unique (id, invitation_id)
);

create index rsvps_invitation_submitted_idx on public.rsvps (invitation_id, submitted_at desc);
create unique index rsvps_edit_token_hash_key on public.rsvps (edit_token_hash) where edit_token_hash is not null;

create trigger rsvps_set_updated_at
  before update on public.rsvps
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rsvp_event_responses: attendance per event (e.g. Mass vs reception).
-- Composite foreign keys guarantee the RSVP and the event belong to the
-- same invitation, with no trigger needed.
-- ---------------------------------------------------------------------------
create table public.rsvp_event_responses (
  rsvp_id        uuid not null,
  event_id       uuid not null,
  invitation_id  uuid not null,
  attending      boolean not null,
  party_size     smallint not null default 1 check (party_size between 0 and 20),

  primary key (rsvp_id, event_id),
  foreign key (rsvp_id, invitation_id) references public.rsvps (id, invitation_id) on delete cascade,
  foreign key (event_id, invitation_id) references public.invitation_events (id, invitation_id) on delete cascade,
  constraint rsvp_event_responses_declined_has_no_party check (attending or party_size = 0)
);

create index rsvp_event_responses_event_idx on public.rsvp_event_responses (event_id);
create index rsvp_event_responses_invitation_idx on public.rsvp_event_responses (invitation_id);
