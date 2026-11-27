-- =============================================================================
-- Public read path
--
-- The ONLY way unauthenticated callers read invitation data. Returns one
-- published, unlisted invitation with its events and media, as camelCase JSON
-- matching src/invitation/schema/published.ts. Excludes anything private:
-- client, access-code hash, status history, RSVPs.
--
-- Returns NULL for unknown, draft, archived and passcode-protected slugs.
-- (Passcode invitations will get their own verified read path later.)
-- =============================================================================

create function public.get_published_invitation(p_slug text)
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

revoke execute on function public.get_published_invitation(text) from public;
grant execute on function public.get_published_invitation(text) to anon, authenticated;
