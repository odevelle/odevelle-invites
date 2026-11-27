# Development and production environments

ODEVELLE runs on two **completely separate** Supabase projects. The code is identical: everything that differs (URL,
keys, auth settings, email) is configuration. Moving to production is setup, not a rewrite.

| | Development | Production |
|---|---|---|
| Supabase project | "odevelle's Project", ref `sypflcoqisitrzeimzxb` | New project, created at launch |
| Supabase organization and plan | Existing organization, **Free** | A **separate** organization on **Pro** ($25/month) |
| Region | Central EU, Frankfurt (`eu-central-1`) | Central EU, Frankfurt (`eu-central-1`) |
| Data | Demo seed, test couples | Real invitations only. **Never load `supabase/seed.sql`** |
| Used by | Local `next dev`, Vercel **Preview** and **Development** | Vercel **Production** only |
| Site URL (auth) | `http://localhost:3000` | `https://odevelle.com` |
| Email | Supabase default (dev testing only) or Resend's test sender | Resend from `send.odevelle.com` |
| Pauses when idle | Yes, after 7 days without activity (acceptable for development) | No |

## Why two organizations

Supabase bills per **organization**, and one organization has one plan. If the existing organization were upgraded to
Pro, the development project would move to Pro billing with it. Pro includes $10 a month of compute credit, which covers
one project on the default (Micro) size, so a second project in the same Pro organization adds about $10 a month.

So production goes in its own Pro organization, and development stays in the existing Free organization:
**$25 a month in total.** Projects can be moved between organizations later if needed (Project Settings → General →
Transfer project).

What Pro adds for production: no pausing, daily backups (7 days retained), email template changes without restrictions,
higher limits, and the option of point-in-time recovery as an add-on.

## Rules that keep production credentials out of development

- Production keys live in **Vercel (Production scope only)** and a password manager. Never in `.env.local`, never in
  the repo, never in a `NEXT_PUBLIC_` variable.
- Don't create `.env.production` or `.env.production.local` in the repo folder: `next build` and `next start` load
  them, so a local build would quietly talk to production.
- For studio scripts against production (`scripts/clients/provision.mjs`), keep a file **outside the repo** and pass it
  explicitly: `node --env-file=$HOME/.odevelle/production.env scripts/clients/provision.mjs …`.
- The Supabase CLI targets whichever project the repo is **linked** to. Every command prints a `Target:` line: read it
  before confirming anything. Re-link to development as soon as production work is done.
- Vercel's **Preview** environment uses the development keys, so pull-request previews never touch real couples' data.

## Launch checklist: creating production

1. **Organization:** in the Supabase dashboard, create a new organization (e.g. "ODEVELLE") and choose **Pro**.
2. **Project:** create it in that organization: region **Central EU (Frankfurt)**, strong database password (store it in
   the password manager). Under Data access: Data API **on**, "Grant API access to new tables automatically" **off**,
   "Enable RLS on new tables automatically" **on** (the same as development; the migrations grant access explicitly).
3. **Schema:** apply the migrations, never the seed:
   ```bash
   npx supabase link --project-ref <production-ref>
   npx supabase db push --remote --dry-run     # check the Target: line says the production project
   npx supabase db push --remote
   npx supabase link --project-ref sypflcoqisitrzeimzxb   # back to development straight away
   ```
4. **Auth** (docs/auth.md, "Setting up a project"): sign-ups **off**; Site URL `https://odevelle.com`; Redirect URLs
   `https://odevelle.com/auth/confirm**`; email OTP length 6, expiry 3600 s, minimum interval 60 s.
5. **Email:** Resend SMTP on the verified domain `send.odevelle.com` (docs/auth.md). Then the email template from
   `supabase/templates/magic-link.html`, and raise Auth → Rate Limits → emails per hour from 30 to about 100.
6. **Studio admin:** create your own account under Authentication → Users (no email needed), then in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = '<your email>');
   ```
7. **Vercel:** Project → Settings → Environment Variables, **Production** scope only: `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (mark it Sensitive), `ROOT_DOMAIN=odevelle.com`. Keep the
   development values on Preview and Development. Redeploy production.
8. **Verify:**
   - Supabase → Advisors → Security shows no warnings.
   - With the publishable key, table reads fail and `get_published_invitation` works (docs/supabase.md, "Checking a
     live project").
   - Provision a test couple, sign in with a real email, send a test RSVP, check the dashboard and the CSV, then delete
     the test couple (below).
9. **Onboard real couples** with `scripts/clients/provision.mjs` and the production env file from outside the repo.

## Test data on development

These exist on the development project for manual testing (created 27 Nov 2026):

| Invitation | Couple account | Purpose |
|---|---|---|
| `test-couple-a` ("Asha & Rohan (test)") | `test-couple-a@example.com` | 5 replies (the brief's 4 + one sent through the form), meal options on |
| `test-couple-b` ("Maria & Tiago (test)") | `test-couple-b@example.com` | One reply; proves couple A can't see it |

The `example.com` addresses can't receive email. To open their dashboards, get a one-time link:
`node --env-file=.env.local scripts/clients/provision.mjs --invitation test-couple-a --email test-couple-a@example.com --apply --link --site http://localhost:3000`.

To remove them: delete the two users under Authentication → Users, then in the SQL editor:

```sql
delete from public.invitations where slug in ('test-couple-a', 'test-couple-b');   -- replies and settings cascade
delete from public.clients where display_name in ('TEST Couple A', 'TEST Couple B');
```
