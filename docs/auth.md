# Couple sign-in and the Couple Dashboard

Couples sign in with **Supabase Auth email OTP**: one email carries a 6-digit code and a link. There are no passwords,
no order-ID logins, and no public sign-up. The studio creates each couple's account during onboarding.

## How it works

```
Couple                      App (Next.js)                         Supabase
──────                      ─────────────                         ────────
/dashboard ───────────────▶ no session → /login
enters email ─────────────▶ signIn (Server Action) ─────────────▶ signInWithOtp(shouldCreateUser: false)
                            "if this address is registered,       emails code + link (custom SMTP)
                             a code is on its way" (always)
types the code ───────────▶ verifyOtp(email, code) ─────────────▶ session cookies set
   or taps the link ──────▶ /auth/confirm → "Continue" (POST) ──▶ verifyOtp(token_hash)
                            redirect → /dashboard → their invitation(s)
dashboard queries ────────▶ publishable key + session ──────────▶ RLS: owns_invitation() only
```

- **Accounts:** created by `scripts/clients/provision.mjs` (below), never by the login form. `shouldCreateUser: false` and
  "Allow new users to sign up: off" both stop an unknown email from getting an account.
- **No account probing:** the login form gives the same answer whether or not the email has an account.
- **The link needs a click:** `/auth/confirm` uses the one-time token only when the couple presses "Continue" (a POST).
  Corporate email scanners open links automatically and would otherwise use the token up before the couple does.
- **Sessions:** cookies managed by `@supabase/ssr`. `proxy.ts` refreshes them on `/login`, `/auth/*` and `/dashboard/*`
  only, so invitation and marketing pages stay static and never see the cookie. Account responses are `no-store` and
  `noindex`.
- **Sign out** ends this device's session only (`scope: "local"`), so a partner signed in elsewhere stays signed in.
- **Several invitations:** RLS returns every invitation of the couple's client record. With one invitation,
  `/dashboard` goes straight to it; with several, it shows a chooser and the header gets a switcher.
- **The real boundary is the database.** Every dashboard query and the CSV export run as the signed-in user with the
  publishable key, under RLS. The secret key is never used for anything a couple reads. Tests:
  `tests/db/dashboard.spec.ts`, `tests/db/access.spec.ts`.

## Costs and email limits (checked 27 Nov 2026)

| | Limit | Cost |
|---|---|---|
| Supabase Auth, Free plan | 50,000 monthly active users | €0 |
| Supabase's built-in email | **2 emails an hour, and only to members of your Supabase team** | €0, but unusable for customers |
| Custom SMTP in Supabase | Starts at 30 emails an hour (adjustable under Auth → Rate Limits) | Free in Supabase; you pay the provider |
| Email templates, Free plan | **Can't be edited while using Supabase's default email** (since June 2026). Editable once custom SMTP is set | – |
| **Resend** (recommended) | Free: 3,000 emails a month, 100 a day | €0 at ODEVELLE's volume. Pro from $20/month if ever needed |
| Brevo | Free: 300 a day | €0, but adds a "Sent with Brevo" footer to every email |
| Amazon SES | Pay as you go | $0.10 per 1,000 emails, more setup |

**Every email-based sign-in needs custom SMTP**: the built-in service can't email customers, and on the Free plan the
code-and-link template (`supabase/templates/magic-link.html`) can't even be installed without it. Volume is small (one email
per sign-in; a few hundred couples signing in a few times a month stays well inside Resend's free tier). The 100-a-day
cap is the one to watch on a busy day.

**Blocker:** a custom SMTP provider needs a verified sending domain, and `odevelle.com` isn't registered yet. `send` is
already a reserved slug so `send.odevelle.com` can carry the email DNS records. Until then, use
`provision.mjs --link` to give a couple a one-time sign-in link by hand.

Plans: development stays on Free (it can pause after 7 idle days; that's fine there). Production launches on Pro in its
own organization: see [production.md](production.md).

## Where development stands (27 Nov 2026)

Applied to the development project with `supabase config push` (auth settings only): sign-ups **off**, Redirect URL
`http://localhost:3000/auth/confirm**`, OTP length **6** (it was 8), expiry 3600 s, minimum interval 60 s. Site URL was
already `http://localhost:3000`.

**Not yet possible:** the email template. Supabase refuses template changes on a Free project that uses the default
email provider (`entitlement_required: auth.email_templates`). Until Resend is connected, sign-in emails use Supabase's
default "Magic link" template: a link but no typed code. The app handles that link too (`/auth/confirm?code=…`), but it
only works in the browser where the couple asked for it, and the default sender only delivers to members of the
Supabase team (2 an hour).

**To test real sign-in emails on development before the domain exists:** create a free Resend account and an API key,
then set SMTP on the development project with Resend's test sender `onboarding@resend.dev`. Resend delivers from that
sender **only to the Resend account owner's own address**, so provision a test couple with that address. Once SMTP is
on, the template push works:

```bash
# after adding custom SMTP in the dashboard, from a folder holding only the auth settings and the template
npx supabase config push --remote=sypflcoqisitrzeimzxb
```

## Setting up a project

In the Supabase dashboard (or `npx supabase config push` from `supabase/config.jsonc`, which holds the same settings
for local development):

1. **Authentication → Sign In / Providers:** Email **on**. "Allow new users to sign up" **off**. Email OTP expiry
   3600 s, length 6.
2. **Authentication → URL Configuration:**
   - Site URL: `https://odevelle.com` (the sign-in email's link is built on it).
   - Redirect URLs: `https://odevelle.com/auth/confirm**`, plus `http://localhost:3000/auth/confirm**` on development
     projects.
3. **Authentication → Email Templates → Magic link:** subject `Your ODEVELLE sign-in code: {{ .Token }}`, body from
   `supabase/templates/magic-link.html`.
4. **Authentication → Rate Limits:** keep "minimum interval per user" at 60 s (the login form's resend countdown matches
   it). After enabling SMTP, raise "emails per hour" from 30 to what you need (e.g. 100).
5. **Custom SMTP** (Project Settings → Authentication → SMTP), once the domain exists:
   - In Resend: add the domain `send.odevelle.com`, add its SPF, DKIM and return-path records at the DNS host, and
     create an API key with sending access only.
   - In Supabase: host `smtp.resend.com`, port `465`, user `resend`, password = the API key, sender
     `ODEVELLE <hello@send.odevelle.com>`.
   - Send yourself a code and check it arrives (and isn't in spam).
6. **Vercel env:** nothing new. Sign-in uses `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

## Onboarding a couple

There's no checkout in the app yet, so the studio runs this after an order (when a checkout exists, it can do the same
steps):

```bash
# Dry run: shows what would change
node --env-file=.env.local scripts/clients/provision.mjs --invitation chloe-shane --email couple@example.com

# Create the account (no email is sent) and link it to the couple; optionally set the meal question
node --env-file=.env.local scripts/clients/provision.mjs --invitation chloe-shane --email couple@example.com \
  --name "Chloe & Shane" --meals "Vegetarian,Non-vegetarian" --apply

# While there's no email provider: also print a one-time sign-in link to send by WhatsApp
node --env-file=.env.local scripts/clients/provision.mjs --invitation chloe-shane --email couple@example.com --apply --link
```

- Use the email the couple ordered with. They sign in at `odevelle.com/login` (or the header's "Couple Dashboard").
- A couple with several invitations: run it once per invitation with the same email. Invitations under the same client
  record are linked by one run.
- One login per couple, managing all of that couple's invitations. Separate partner logins would need a small
  `client_members` table (a possible later feature).
- Set meal options **before** publishing. A published invitation's page is cached for up to a day, so a change shows
  on the form only once the cache refreshes (or after a deploy).
- The guest limit isn't a setting: every RSVP allows 1–50 guests (including the guest), 0 when declining.

## Troubleshooting

| Symptom | Cause |
|---|---|
| "If this address is registered, a code is on its way" but nothing arrives | No account for that email (by design, the form doesn't say so), no custom SMTP yet, or spam folder |
| "Please wait a minute before asking for another" | Supabase's 60 s per-address limit, or the project's hourly email limit |
| "That code has expired or has already been used" | Codes last an hour and work once; request a new one |
| Link opens `/login?error=link` | Token used already (often by an email scanner if the template was changed to a direct verify link) or expired |
| Dashboard says "No invitations here yet" | The account isn't linked to the couple's client record: run `provision.mjs` |
