-- =============================================================================
-- Row Level Security
--
-- Model (deliberately small):
--   anon           → no table access at all. Guests read published invitations
--                    only through get_published_invitation() (next migration)
--                    and will submit RSVPs only through submit_rsvp() (Phase 6).
--   authenticated  → clients see rows belonging to their own invitations;
--                    admins (profiles.role = 'admin') see and manage everything.
--   service role   → bypasses RLS; used only in server-only code.
--
-- In V1 the studio manages invitations, so clients are read-only. Client
-- self-service can be added later as extra policies, without restructuring.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper predicates. SECURITY DEFINER so they can read profiles/clients
-- without tripping those tables' own policies (avoids policy recursion).
-- ---------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create function public.owns_invitation(p_invitation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.invitations i
    join public.clients c on c.id = i.client_id
    where i.id = p_invitation_id
      and c.owner_user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.owns_invitation(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_invitation(uuid) to authenticated;

-- Internal trigger functions are never callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.invitations_validate() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere, and take away Supabase's default anon table grants
-- (defence in depth: anon has neither privileges nor policies).
-- ---------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.clients               enable row level security;
alter table public.reserved_slugs        enable row level security;
alter table public.invitations           enable row level security;
alter table public.invitation_versions   enable row level security;
alter table public.invitation_events     enable row level security;
alter table public.invitation_media      enable row level security;
alter table public.rsvps                 enable row level security;
alter table public.rsvp_event_responses  enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges, stated explicitly so the result is the same whether or not
-- the project has "grant API access to new tables automatically" turned on:
-- start from nothing, then grant each role only what its policies below use.
-- anon gets nothing. reserved_slugs is read only by the validation trigger.
-- ---------------------------------------------------------------------------
revoke all on table
  public.profiles, public.clients, public.reserved_slugs, public.invitations,
  public.invitation_versions, public.invitation_events, public.invitation_media,
  public.rsvps, public.rsvp_event_responses
from anon, authenticated, service_role;

grant select, update                 on public.profiles             to authenticated;
grant select, insert, update, delete on public.clients              to authenticated;
grant select, insert, update, delete on public.invitations          to authenticated;
grant select, insert                 on public.invitation_versions  to authenticated;
grant select, insert, update, delete on public.invitation_events    to authenticated;
grant select, insert, update, delete on public.invitation_media     to authenticated;
grant select, update, delete         on public.rsvps                to authenticated;
grant select, delete                 on public.rsvp_event_responses to authenticated;

-- Server-only code (secret key). It bypasses RLS but still needs privileges.
grant select, insert, update, delete on
  public.profiles, public.clients, public.invitations, public.invitation_events,
  public.invitation_media, public.rsvps, public.rsvp_event_responses
to service_role;
grant select, insert on public.invitation_versions to service_role;
grant select         on public.reserved_slugs      to service_role;

-- ---------------------------------------------------------------------------
-- profiles: read your own; only admins change roles.
-- ---------------------------------------------------------------------------
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: admin updates" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- clients: owners read their own record; admins manage.
-- ---------------------------------------------------------------------------
create policy "clients: read own or admin" on public.clients
  for select to authenticated
  using (owner_user_id = (select auth.uid()) or (select public.is_admin()));

create policy "clients: admin inserts" on public.clients
  for insert to authenticated with check ((select public.is_admin()));
create policy "clients: admin updates" on public.clients
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "clients: admin deletes" on public.clients
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- invitations and their children: owners read, admins manage.
-- (Public guests never touch these tables; see get_published_invitation.)
-- ---------------------------------------------------------------------------
create policy "invitations: read own or admin" on public.invitations
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(id)));

create policy "invitations: admin inserts" on public.invitations
  for insert to authenticated with check ((select public.is_admin()));
create policy "invitations: admin updates" on public.invitations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "invitations: admin deletes" on public.invitations
  for delete to authenticated using ((select public.is_admin()));

-- Versions are append-only: no update or delete policy for anyone.
create policy "invitation_versions: read own or admin" on public.invitation_versions
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));
create policy "invitation_versions: admin inserts" on public.invitation_versions
  for insert to authenticated with check ((select public.is_admin()));

create policy "invitation_events: read own or admin" on public.invitation_events
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));
create policy "invitation_events: admin inserts" on public.invitation_events
  for insert to authenticated with check ((select public.is_admin()));
create policy "invitation_events: admin updates" on public.invitation_events
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "invitation_events: admin deletes" on public.invitation_events
  for delete to authenticated using ((select public.is_admin()));

create policy "invitation_media: read own or admin" on public.invitation_media
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));
create policy "invitation_media: admin inserts" on public.invitation_media
  for insert to authenticated with check ((select public.is_admin()));
create policy "invitation_media: admin updates" on public.invitation_media
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "invitation_media: admin deletes" on public.invitation_media
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- RSVPs: private. Owners read and may delete (e.g. spam); admins manage.
-- No insert policy: guests submit through submit_rsvp() (Phase 6), which
-- derives the invitation from the slug on the server.
-- ---------------------------------------------------------------------------
create policy "rsvps: read own or admin" on public.rsvps
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));
create policy "rsvps: admin updates" on public.rsvps
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "rsvps: owner or admin deletes" on public.rsvps
  for delete to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));

create policy "rsvp_event_responses: read own or admin" on public.rsvp_event_responses
  for select to authenticated
  using ((select public.is_admin()) or (select public.owns_invitation(invitation_id)));
create policy "rsvp_event_responses: admin deletes" on public.rsvp_event_responses
  for delete to authenticated using ((select public.is_admin()));
