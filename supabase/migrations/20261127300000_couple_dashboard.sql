-- =============================================================================
-- Couple dashboard: read side
--
-- Couples sign in with Supabase Auth (email code / link) and read through the
-- PUBLISHABLE key as `authenticated`, so every query below runs under RLS:
-- `rsvps: read own or admin` (owns_invitation) is what keeps one couple's
-- guests from another's. Nothing here uses or needs the secret key.
--
--   column grants      couples read guest-facing columns only, never the
--                      connection hash or edit-token hash.
--   rsvp_responses     the dashboard's list: replies plus how many replies on
--                      the same invitation share the guest's name (duplicates).
--   rsvp_summary()     the four headline figures in one aggregate.
--   index              filter by attendance, newest first.
--
-- Search is a case-insensitive substring match on guest_name. Every query is
-- bounded by invitation_id, and submit_rsvp caps an invitation at 2,000
-- replies, so the (invitation_id, …) indexes keep it fast without pg_trgm.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Column-level read access for signed-in users.
-- ---------------------------------------------------------------------------
revoke select on public.rsvps from authenticated;
grant select (id, invitation_id, guest_name, attending, party_size, meal_preference, message, submitted_at, updated_at)
  on public.rsvps to authenticated;

-- ---------------------------------------------------------------------------
-- The list view. security_invoker: it runs with the caller's privileges and
-- RLS, exactly as if they queried rsvps themselves.
-- ---------------------------------------------------------------------------
create view public.rsvp_responses
with (security_invoker = true)
as
select
  r.id,
  r.invitation_id,
  r.guest_name,
  r.attending,
  r.party_size,
  r.meal_preference,
  r.message,
  r.submitted_at,
  -- Partitioned by invitation, so a filter on invitation_id is applied first;
  -- filters on attendance or name apply after, so this counts every reply.
  count(*) over (partition by r.invitation_id, lower(btrim(r.guest_name)))::integer as same_name_count
from public.rsvps r;

revoke all on public.rsvp_responses from anon, authenticated, service_role;
grant select on public.rsvp_responses to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Headline figures. Attending / declined count replies; guests sums the party
-- sizes of accepted replies only. Runs as the caller, so RLS applies: another
-- couple's invitation id returns zeros, never their numbers.
-- ---------------------------------------------------------------------------
create function public.rsvp_summary(p_invitation_id uuid)
returns table (total integer, attending integer, declined integer, guests integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*)::integer,
    count(*) filter (where r.attending)::integer,
    count(*) filter (where not r.attending)::integer,
    coalesce(sum(r.party_size) filter (where r.attending), 0)::integer
  from public.rsvps r
  where r.invitation_id = p_invitation_id;
$$;

revoke execute on function public.rsvp_summary(uuid) from public, anon;
grant execute on function public.rsvp_summary(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Filter by attendance, newest first. (invitation_id, submitted_at desc)
-- already serves the unfiltered list.
-- ---------------------------------------------------------------------------
create index rsvps_invitation_attending_submitted_idx
  on public.rsvps (invitation_id, attending, submitted_at desc);
