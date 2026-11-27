# Supabase

The invitation platform's data, RSVPs (Phase 6) and media live in one Supabase project. This guide covers
setting it up, applying the migrations, and how the app reads from it.

> **Status:** migrations are written and tested locally (`npm run test:db`), **not applied** to any project.
> Applying them needs explicit approval.

## What's in the database

| Migration | Contents |
|---|---|
| `20261126100000_core_schema.sql` | Tables, enums, constraints, indexes, triggers (reserved slugs, time zones, `published_at`, new-user profiles) |
| `20261126100100_row_level_security.sql` | RLS on every table; `is_admin()` / `owns_invitation()` helpers; explicit table grants per role (`anon` gets none) |
| `20261126100200_public_invitation_read.sql` | `get_published_invitation(slug)`: guests' only read path |
| `20261127100000_storage.sql` | Public `invitation-media` bucket (types and size limit), storage policies, `owns_storage_object()` |

Access model:

| Who | Postgres role | Can |
|---|---|---|
| Guests (the website, publishable key) | `anon` | Execute `get_published_invitation()` only: one published, unlisted invitation, without client details, the access-code hash or RSVPs. No table access at all. Fetch media by its exact public URL; can't list the bucket. |
| Couples (signed in, future dashboard) | `authenticated` | Read their own client record, invitations, events, media, version history, RSVPs and storage folder. Delete RSVPs on their own invitations. Nothing else. |
| The studio | `authenticated` + `profiles.role = 'admin'` | Manage everything, including storage. Version history stays append-only. |
| Server scripts | secret key (bypasses RLS) | Server-only. Never in the browser, never in a `NEXT_PUBLIC_` variable. |

`noindex` keeps invitations out of search engines. It is **not** access control: anyone with the link can view an
unlisted invitation. RSVPs and client data are protected by RLS, not by obscurity.

## How the app reads invitations

`src/invitation/source.ts` picks the source:

| Condition | Source |
|---|---|
| `ENABLE_INVITATION_FIXTURES=true` | Fixtures (`src/invitation/fixtures.ts`). The E2E suite uses this, so tests never depend on a live project. |
| `SUPABASE_URL` set | Supabase (`src/invitation/supabase-source.ts`): an RPC to `get_published_invitation` with the **publishable** key |
| Development, no Supabase | Fixtures |
| Production, no Supabase | Nothing: every slug is "not found" |

Media URLs are `{SUPABASE_URL}/storage/v1/object/public/invitation-media/{invitation_id}/{kind}/{file}`, served by
Supabase's CDN. `next.config.ts` allows exactly that path for `next/image`.

**Caching.** Each invitation is cached per slug (`"use cache"`, `cacheLife("days")`, tags `invitation-slug:{slug}` and
`invitation:{id}`). An edit made directly in the database can take up to a day to appear, or until the next deploy.
The future dashboard will call `revalidateTag` on publish. A Supabase outage throws and shows the "temporarily
unavailable" page; it's never cached as "not found".

## Setting up a project

1. **Create the project** at supabase.com: region **Central EU (Frankfurt), `eu-central-1`**. The region can't be changed
   later without migrating. Use a strong database password and keep it in a password manager.
   Under **Data access**: Data API **on**, "Grant API access to new tables automatically" **off**, "Enable RLS on new
   tables automatically" **on**. So every future migration that adds a table must grant access explicitly.
2. **Auth settings** (Authentication → Sign In / Providers): turn **off** "Allow new users to sign up" until the client
   dashboard exists. A stray sign-up would only get an empty client profile, but there's no reason to allow it.
3. **Keys** (Project Settings → API Keys): copy the project URL, the **publishable** key (`sb_publishable_…`) and the
   **secret** key (`sb_secret_…`). Legacy `anon` / `service_role` keys also work in the same slots.
4. **Local env**: copy `.env.example` to `.env.local` and fill in all three. `.env.local` is git-ignored.
5. **Vercel env** (Project → Settings → Environment Variables):
   - `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Production, Preview and Development.
   - `SUPABASE_SECRET_KEY`: **not needed yet** (the site only reads with the publishable key). Add it only when a
     server feature needs it (RSVP submission, admin), and never with a `NEXT_PUBLIC_` prefix.
   - Redeploy so `next.config.ts` picks up the image host.

A separate project for previews and development (with demo data) is recommended, so production only ever holds
real invitations.

## Applying the migrations (after approval)

```bash
npx supabase init          # once: creates supabase/config.toml (migrations are kept)
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run   # lists what would run; check it
npx supabase db push             # applies supabase/migrations/* in order
```

Then make yourself an admin (SQL editor, after signing in once or creating the user under Authentication → Users):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '<your email>');
```

Never edit an applied migration. Changes go in a new timestamped file, tested with `npm run test:db` first.

## Demo data (development and preview projects only)

`supabase/seed.sql` loads every fixture invitation under one demo client. It's generated from the fixtures: run
`npm run db:seed:generate` after changing them (`npm run test:db` fails if it's stale).

```bash
npx supabase db push --include-seed                                         # schema + demo invitations
node --env-file=.env.local scripts/db/upload-fixture-media.mjs              # dry run: lists the files
node --env-file=.env.local scripts/db/upload-fixture-media.mjs --apply      # uploads demo photos
```

Don't load the seed into production. It publishes demo invitations at real slugs such as `charlotte-henry`.

## Checking a live project

After applying, verify on the real project (the local tests use Postgres in WebAssembly with stand-ins for Supabase's
auth and storage schemas):

- Open `/sites/<a published slug>` and check it renders with Storage images.
- With the publishable key, `select` on any table returns an error or no rows; RPC `get_published_invitation` works:
  ```bash
  curl "$SUPABASE_URL/rest/v1/rsvps?select=*" -H "apikey: $SUPABASE_PUBLISHABLE_KEY"            # must fail or be empty
  curl "$SUPABASE_URL/rest/v1/rpc/get_published_invitation" -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
       -H "Content-Type: application/json" -d '{"p_slug":"<slug>"}'                               # returns the invitation
  ```
- Supabase's Security Advisor (Database → Advisors) shows no RLS warnings.

## Local tests

`npm run test:db` runs the migrations on real Postgres (PGlite) with automatic API grants off (the access suite also
runs with them on), then checks
RLS for every role, every constraint, the storage policies, the public read path (every fixture round-trips to the same
rendered invitation), and the app's Supabase source through the real `supabase-js` client. No Docker or cloud project
is needed. Harness: `tests/db/harness.ts`, stand-ins: `tests/db/supabase-stubs.sql`.
