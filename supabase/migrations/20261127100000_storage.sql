-- =============================================================================
-- Storage: invitation media
--
-- One public bucket, "invitation-media". Objects live under
-- "{invitation_id}/{kind}/{uuid}.{ext}" (the same rule invitation_media
-- enforces), with unguessable file names.
--
-- Public bucket = anyone with an object's URL can fetch it through the CDN;
-- that is how guests see photos. It does NOT allow listing: listing goes
-- through storage.objects, where anon has no policy, so nobody can browse
-- one couple's folder or enumerate others.
--
-- Writes: admins only in V1 (the studio uploads). Owners can see their own
-- folder's objects for the future dashboard. Bucket-level limits mirror
-- MEDIA_RULES in src/invitation/schema/media.ts; the app and the
-- invitation_media constraints apply the stricter per-kind limits.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-media',
  'invitation-media',
  true,
  157286400, -- 150 MB: the largest kind (video). Images and audio are capped at 15 MB by the app and DB.
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'audio/mpeg', 'audio/mp4', 'audio/aac',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- True when the object's first folder is an invitation the current user owns.
-- Compares as text, so an object path that isn't a UUID simply doesn't match.
create function public.owns_storage_object(p_name text)
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
    where i.id::text = (storage.foldername(p_name))[1]
      and c.owner_user_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_storage_object(text) from public, anon;
grant execute on function public.owns_storage_object(text) to authenticated;

create policy "invitation-media: admins manage" on storage.objects
  for all to authenticated
  using (bucket_id = 'invitation-media' and (select public.is_admin()))
  with check (bucket_id = 'invitation-media' and (select public.is_admin()));

create policy "invitation-media: owners see their folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'invitation-media' and (select public.owns_storage_object(name)));
