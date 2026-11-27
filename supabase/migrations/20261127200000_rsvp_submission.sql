-- =============================================================================
-- RSVP submission
--
--   rsvp_settings        an invitation's meal options (none = no meal question).
--   rsvps (changes)      guest count: 1–50 when attending, 0 when declining
--                        (one universal limit, no per-couple or package
--                        limits); meal_preference; client_submission_id so a
--                        double-click or a retried request stores one reply.
--   get_published_invitation()  now also returns the RSVP settings.
--   submit_rsvp()        the only way an RSVP is written. Called by the app's
--                        server (the RSVP Server Action) with the SECRET key,
--                        never by browsers: anon and authenticated can't
--                        execute it, so the public key can't be used to spam
--                        replies around the app's own checks.
--
-- Split of responsibilities:
--   app (TypeScript)  validates the form (same 1–50 rule, src/invitation/rsvp/
--                     limits.ts), checks the reply window, hashes the guest's IP.
--   this function     is authoritative for everything stored: derives the
--                     invitation from the slug (never trusts an id), requires
--                     it to be published and unlisted, accepts only a configured
--                     meal option, de-duplicates retries, and rate-limits per
--                     guest connection and per invitation. The guest-count rule
--                     is also a table constraint, so no write path can skip it.
--
-- Errors are raised as "rsvp:<reason>" so the app can show a calm message.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- rsvp_settings: one row per invitation, optional (no row = no meal question).
-- ---------------------------------------------------------------------------

-- 0–6 options, each 1–40 characters once trimmed, no repeats (ignoring case).
create function public.rsvp_meal_options_valid(p_options text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(p_options) <= 6
     and array_position(p_options, null) is null
     and not exists (select 1 from unnest(p_options) o where char_length(btrim(o)) not between 1 and 40 or o <> btrim(o))
     and (select count(distinct lower(o)) from unnest(p_options) o) = cardinality(p_options);
$$;

create table public.rsvp_settings (
  invitation_id   uuid primary key references public.invitations (id) on delete cascade,
  -- Empty: the form doesn't ask about meals.
  meal_options    text[] not null default '{}' check (public.rsvp_meal_options_valid(meal_options)),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger rsvp_settings_set_updated_at
  before update on public.rsvp_settings
  for each row execute function public.set_updated_at();

alter table public.rsvp_settings enable row level security;

revoke all on table public.rsvp_settings from anon, authenticated, service_role;
grant select, insert, update, delete on public.rsvp_settings to authenticated;
grant select, insert, update, delete on public.rsvp_settings to service_role;

-- Couples read their own settings; the studio sets them during onboarding.
create policy "rsvp_settings: read own or admin" on public.rsvp_settings
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));
create policy "rsvp_settings: admin inserts" on public.rsvp_settings
  for insert to authenticated with check ((select public.is_admin()));
create policy "rsvp_settings: admin updates" on public.rsvp_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "rsvp_settings: admin deletes" on public.rsvp_settings
  for delete to authenticated using ((select public.is_admin()));

-- Pure, but evaluated with the writer's privileges inside the check constraint.
revoke execute on function public.rsvp_meal_options_valid(text[]) from public, anon;
grant execute on function public.rsvp_meal_options_valid(text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- rsvps: guest count, meal choice and retry de-duplication.
-- (email, phone and dietary stay for compatibility; the form no longer asks.)
-- ---------------------------------------------------------------------------

-- Guests per reply, including the person replying: 1–50 when attending, 0 when
-- declining. Replaces the core schema's 0–20 range and its "declined has no
-- party" rule with one constraint that states both. (No rows break it: the old
-- range is inside the new one.)
alter table public.rsvps
  drop constraint rsvps_party_size_check,
  drop constraint rsvps_declined_has_no_party,
  add constraint rsvps_guest_count check (
    (attending and party_size between 1 and 50) or (not attending and party_size = 0)
  );

alter table public.rsvps
  add column meal_preference text check (char_length(meal_preference) between 1 and 40),
  add column client_submission_id uuid,
  add constraint rsvps_declined_has_no_meal check (attending or meal_preference is null),
  -- NULLs are distinct, so replies without an id never collide.
  add constraint rsvps_invitation_submission_key unique (invitation_id, client_submission_id);

-- ---------------------------------------------------------------------------
-- Public read path, now with the RSVP settings (rsvpSettings: null when unset).
-- ---------------------------------------------------------------------------
create or replace function public.get_published_invitation(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id',            i.id,
    'slug',          i.slug,
    'title',         i.title,
    'occasion',      i.occasion,
    'package',       i.package,
    'designId',      i.design_id,
    'designVersion', i.design_version,
    'locale',        i.locale,
    'timeZone',      i.time_zone,
    'primaryDate',   i.primary_date,
    'content',       i.content,
    'appearance',    i.appearance,
    'designOptions', i.design_options,
    'features',      i.features,
    'publishedAt',   i.published_at,
    'rsvpSettings', (
      select jsonb_build_object('mealOptions', to_jsonb(s.meal_options))
      from public.rsvp_settings s
      where s.invitation_id = i.id
    ),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',          e.id,
        'kind',        e.kind,
        'title',       e.title,
        'startsAt',    e.starts_at,
        'endsAt',      e.ends_at,
        'venueName',   e.venue_name,
        'address',     e.address,
        'latitude',    e.latitude,
        'longitude',   e.longitude,
        'mapUrl',      e.map_url,
        'dressCode',   e.dress_code,
        'notes',       e.notes,
        'rsvpEnabled', e.rsvp_enabled,
        'sortOrder',   e.sort_order
      ) order by e.sort_order, e.starts_at)
      from public.invitation_events e
      where e.invitation_id = i.id
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',          m.id,
        'kind',        m.kind,
        'path',        m.storage_path,
        'mimeType',    m.mime_type,
        'width',       m.width,
        'height',      m.height,
        'durationMs',  m.duration_ms,
        'alt',         m.alt,
        'blurDataUrl', m.blur_data_url,
        'sortOrder',   m.sort_order
      ) order by m.kind, m.sort_order)
      from public.invitation_media m
      where m.invitation_id = i.id
    ), '[]'::jsonb)
  )
  from public.invitations i
  where i.slug = lower(p_slug)
    and i.status = 'published'
    and i.access_mode = 'unlisted';
$$;

-- ---------------------------------------------------------------------------
-- submit_rsvp
-- ---------------------------------------------------------------------------
create function public.submit_rsvp(
  p_slug                  text,
  p_client_submission_id  uuid,
  p_guest_name            text,
  p_attending             boolean,
  p_party_size            integer,
  p_meal                  text,
  p_message               text,
  p_ip_hash               text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invitation_id  uuid;
  v_rsvp_id        uuid;
  v_meal_options   text[];
  v_meal           text := nullif(btrim(p_meal), '');
begin
  -- The invitation comes from the slug, and only a published, unlisted one takes replies.
  select i.id, coalesce(s.meal_options, '{}')
    into v_invitation_id, v_meal_options
  from public.invitations i
  left join public.rsvp_settings s on s.invitation_id = i.id
  where i.slug = lower(p_slug)
    and i.status = 'published'
    and i.access_mode = 'unlisted';

  if v_invitation_id is null then
    raise exception 'rsvp:not_found' using errcode = 'P0002';
  end if;

  -- A retry of a reply that was already stored (double-click, lost response): same row, no new reply.
  if p_client_submission_id is not null then
    select r.id into v_rsvp_id
    from public.rsvps r
    where r.invitation_id = v_invitation_id and r.client_submission_id = p_client_submission_id;
    if v_rsvp_id is not null then
      return v_rsvp_id;
    end if;
  end if;

  -- Rate limits: 10 replies an hour from one connection, 2,000 per invitation.
  if p_ip_hash is not null and (
    select count(*) from public.rsvps r
    where r.invitation_id = v_invitation_id
      and r.ip_hash = p_ip_hash
      and r.submitted_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'rsvp:rate_limited' using errcode = 'P0001';
  end if;

  if (select count(*) from public.rsvps r where r.invitation_id = v_invitation_id) >= 2000 then
    raise exception 'rsvp:full' using errcode = 'P0001';
  end if;

  if p_attending is null then
    raise exception 'rsvp:invalid (attending)' using errcode = '22023';
  end if;

  -- Guests per reply, including the person replying (also the rsvps_guest_count constraint).
  if p_attending and (p_party_size is null or p_party_size not between 1 and 50) then
    raise exception 'rsvp:invalid (party size)' using errcode = '22023';
  end if;

  -- Meals only matter for guests who are coming, and only from the couple's list.
  if not p_attending then
    v_meal := null;
  elsif v_meal is not null and not (v_meal = any (v_meal_options)) then
    raise exception 'rsvp:invalid (meal)' using errcode = '22023';
  end if;

  -- Column checks (name length, hash format) apply on insert.
  -- On a concurrent retry the unique key makes the second insert a no-op.
  insert into public.rsvps (invitation_id, client_submission_id, guest_name, attending, party_size, meal_preference, message, ip_hash)
  values (
    v_invitation_id,
    p_client_submission_id,
    btrim(p_guest_name),
    p_attending,
    case when p_attending then p_party_size else 0 end,
    v_meal,
    nullif(btrim(p_message), ''),
    p_ip_hash
  )
  on conflict (invitation_id, client_submission_id) do nothing
  returning id into v_rsvp_id;

  if v_rsvp_id is null then
    select r.id into v_rsvp_id
    from public.rsvps r
    where r.invitation_id = v_invitation_id and r.client_submission_id = p_client_submission_id;
  end if;

  return v_rsvp_id;
end;
$$;

revoke execute on function public.submit_rsvp(text, uuid, text, boolean, integer, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_rsvp(text, uuid, text, boolean, integer, text, text, text)
  to service_role;

-- "send" will carry transactional-email DNS records (send.odevelle.com), which
-- override the invitation wildcard, so no invitation may take it.
insert into public.reserved_slugs (slug) values ('send') on conflict (slug) do nothing;
