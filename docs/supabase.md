# Supabase

The invitation platform's data, RSVPs and media live in one Supabase project. This guide covers setting it up,
applying the migrations, and how the app reads and writes.

> **Status:** all six migrations are applied to the **development** project (the last two on 27 Nov 2026, with
> approval), with the demo seed. Production doesn't exist yet: see [production.md](production.md). Every migration
> needs explicit approval before it's applied anywhere, and production needs its own approval.

## What's in the database

| Migration | Contents |
|---|---|
| `20261126100000_core_schema.sql` | Tables, enums, constraints, indexes, triggers (reserved slugs, time zones, `published_at`, new-user profiles) |
| `20261126100100_row_level_security.sql` | RLS on every table; `is_admin()` / `owns_invitation()` helpers; explicit table grants per role (`anon` gets none) |
| `20261126100200_public_invitation_read.sql` | `get_published_invitation(slug)`: guests' only read path |
| `20261127100000_storage.sql` | Public `invitation-media` bucket (types and size limit), storage policies, `owns_storage_object()` |
| `20261127200000_rsvp_submission.sql` | `rsvp_settings` (meal options); `rsvps` guest count 1–50 / 0 (`rsvps_guest_count`), `meal_preference` and `client_submission_id`; `get_published_invitation` returns the settings; `submit_rsvp()`: the only write path for RSVPs (secret key only), with limits, de-duplication and rate limits; reserves `send` |
| `20261127300000_couple_dashboard.sql` | Column-level read grants on `rsvps` (couples never see hashes); `rsvp_responses` view (with likely-duplicate count); `rsvp_summary()`; attendance index |

Access model:

| Who | Postgres role | Can |
|---|---|---|
| Guests (the website, publishable key) | `anon` | Execute `get_published_invitation()` only: one published, unlisted invitation, without client details, the access-code hash or RSVPs. No table access at all. Fetch media by its exact public URL; can't list the bucket. |
| Couples (signed in to the Couple Dashboard, docs/auth.md) | `authenticated` | Read their own client record, invitations, events, media, version history, RSVP settings, RSVPs (guest-facing columns only) and storage folder. Delete RSVPs on their own invitations. Nothing else. |
| The studio | `authenticated` + `profiles.role = 'admin'` | Manage everything, including storage. Version history stays append-only. |
| The app's server (RSVP Server Action) and scripts | `service_role` (secret key; bypasses RLS) | Execute `submit_rsvp()`. Server-only: never in the browser, never in a `NEXT_PUBLIC_` variable. |

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

## How guests reply (RSVPs)

The form (`src/designs/shared/rsvp/RsvpForm.tsx`, styled per theme through `src/designs/{id}/v{n}/rsvp.ts`) asks for:
full name, accept or decline, and when accepting, the number of guests (a 1–50 dropdown, including the guest) and a
meal, if the couple set meal options. Then an optional message. No email, phone or address. It posts to a Server Action
(`src/invitation/rsvp/actions.ts`):

1. The server loads the invitation by slug and derives the rules from it (`src/invitation/rsvp/rules.ts`): whether it
   takes replies, the meal options (`rsvp_settings`), and when replies close (the start of the last RSVP event). The
   guest limit is universal: 1–50 when accepting, 0 when declining (`src/invitation/rsvp/limits.ts`). The browser only sends the slug and the answers.
2. Zod validates the answers against those rules (`schema.ts`). A filled honeypot field is treated as a bot: it's told
   "sent" and nothing is stored.
3. `submit_rsvp()` runs with the secret key. It derives the invitation from the slug again, requires it published and
   unlisted, enforces 1–50 guests (also a table constraint, `rsvps_guest_count`), accepts only a configured meal option, and
   rate-limits: 10 replies an hour from one connection per invitation, 2,000 per invitation. The connection is an HMAC
   of the IP; raw IPs are never stored. Each filled-in form carries a random `client_submission_id`, so a double-click
   or a retried request stores one reply.
4. Couples read replies in the Couple Dashboard (docs/auth.md), through RLS. No reply ever goes back to the browser.

Writes mirror reads: with `ENABLE_INVITATION_FIXTURES=true`, or in development without Supabase, replies are accepted
and not stored.

Per-event answers (`rsvp_event_responses`) are no longer collected: the form asks one question per invitation. The
table stays, unused, so they can return.

## The Couple Dashboard

`/dashboard/{slug}` (`src/app/(marketing)/(account)/dashboard`, data in `src/dashboard/data.ts`). Every read runs as the
signed-in couple with the publishable key, so RLS decides what exists:

- Summary: `rsvp_summary(invitation_id)`: total, attending and declined count replies; confirmed guests is the sum of
  guests on accepted replies.
- List: `rsvp_responses`, filtered (all / attending / declined), searched (case-insensitive `ilike`, wildcards
  escaped) and paged (25) on the server. Search waits for a 350 ms pause in typing. Filter, search, page and the open
  reply live in the URL.
- CSV: `/dashboard/{slug}/export` (route handler, same RLS), all replies or the current filter and search. Quoted
  cells, UTF-8 BOM, CRLF, and a leading `'` on cells that would run as spreadsheet formulas.
- No Realtime: a Refresh button re-reads on demand.

## Setting up a project

1. **Create the project** at supabase.com: region **Central EU (Frankfurt), `eu-central-1`**. The region can't be changed
   later without migrating. Use a strong database password and keep it in a password manager.
   Under **Data access**: Data API **on**, "Grant API access to new tables automatically" **off**, "Enable RLS on new
   tables automatically" **on**. So every future migration that adds a table must grant access explicitly.
2. **Auth settings**: see docs/auth.md (sign-ups off, email template, redirect URLs, custom SMTP). Couple accounts are
   created only by `scripts/clients/provision.mjs`.
3. **Keys** (Project Settings → API Keys): copy the project URL, the **publishable** key (`sb_publishable_…`) and the
   **secret** key (`sb_secret_…`). Legacy `anon` / `service_role` keys also work in the same slots.
4. **Local env**: copy `.env.example` to `.env.local` and fill in all three. `.env.local` is git-ignored.
5. **Vercel env** (Project → Settings → Environment Variables):
   - `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Production, Preview and Development (also used for couple sign-in).
   - `SUPABASE_SECRET_KEY`: needed for **RSVPs** (the Server Action writes with it). Server-only: mark it
     **Sensitive** in Vercel and never give it a `NEXT_PUBLIC_` prefix. Without it, invitations still display but
     the form says replies can't be sent.
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
