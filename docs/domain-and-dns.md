# Domain and DNS plan

Status: **planning only. No DNS or nameserver changes have been made.**

## 1. Current state (checked 26 Nov 2026)

| Check | Result |
|---|---|
| `.com` registry WHOIS (`whois.verisign-grs.com`) | `No match for domain "ODEVELLE.COM"` |
| Public DNS (`dig @1.1.1.1 odevelle.com NS`) | `NXDOMAIN` |

**`odevelle.com` is not registered.** There are no existing DNS records, so there are no email or other
records to preserve. The domain is currently available to anyone, so register it before the brand is
promoted further.

## 2. Registration

- Register `odevelle.com` either through Vercel (nameservers are set automatically) or through any
  registrar that lets you set custom nameservers.
- **Avoid registrars that lock you to their own DNS** (for example Cloudflare Registrar). Wildcard
  certificates on Vercel need the domain on Vercel's nameservers.
- Turn on registrar lock, auto-renew and WHOIS privacy.

## 3. Vercel setup (when registered)

1. Nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`.
2. In the Vercel project, add the following domains:
   - `odevelle.com`: marketing site (primary).
   - `www.odevelle.com`: redirect to the apex. The app also redirects `www` (see below).
   - `*.odevelle.com`: invitations. Vercel issues the wildcard certificate automatically on Vercel DNS.
3. Environment: `ROOT_DOMAIN=odevelle.com` (see `.env.example`).
4. CAA: only add one if needed. If you do, it must allow `letsencrypt.org` (Vercel's certificate authority).

Explicit records always win over the wildcard, so `mail` and similar records keep working alongside
`*.odevelle.com`. Any name given its own DNS record must also be on the reserved-slug list
(`src/lib/tenant/reserved.ts` and the `reserved_slugs` table, added by a migration), or an invitation
could take a slug its DNS record makes unreachable. `send` (suggested below for transactional email) is
**not** reserved yet: add it before creating that record.

## 3a. How requests are routed

`src/proxy.ts` applies the rules in `src/lib/tenant/routing.ts` to every page request. It's pure, with no
database calls; whether an invitation exists is decided by the page.

| Request | Result |
|---|---|
| `{slug}.odevelle.com/` | That invitation (internal rewrite to `/sites/{slug}`; the address bar keeps the subdomain) |
| `{slug}.odevelle.com/anything-else` | 404. An invitation is one page, so another couple's `/sites/…` can't be reached through it |
| `admin.odevelle.com`, `a.b.odevelle.com`, malformed subdomains | 404 (reserved, nested or invalid) |
| Unknown or unpublished `{slug}.odevelle.com` | The "couldn't find this invitation" page, `noindex` (HTTP 200: it streams before the lookup finishes) |
| `www.odevelle.com/…` | 308 to `odevelle.com/…` |
| `odevelle.com/sites/{slug}` | 308 to `{slug}.odevelle.com`, so each invitation has one address |
| `odevelle.com/sites/…` (anything else) | 404 |
| Files (`/designs/…`, `/_next/…`, images, icons) | Served on every host; the proxy doesn't run for them |
| `localhost` and other domains (Vercel preview URLs) | Served as-is, so `/sites/{slug}` keeps working for previews |

Locally, `http://{slug}.localhost:3000` works like `{slug}.odevelle.com` in Chrome, Firefox, Safari and curl,
with no hosts-file changes.

## 4. Email (decide before launch)

Because the domain is new, there is nothing to migrate. These records need to be **created** in Vercel DNS
once a provider is chosen:

| Purpose | Records | Notes |
|---|---|---|
| Studio mailbox (e.g. hello@odevelle.com) | `MX` at apex, `TXT` SPF at apex, DKIM `TXT`/`CNAME` per provider | Google Workspace, Microsoft 365, Zoho, etc. |
| Policy | `TXT` at `_dmarc` | Start with `v=DMARC1; p=none; rua=mailto:…`, tighten to `quarantine` after monitoring. |
| Transactional email (RSVP notifications, later phase) | Provider DKIM/return-path records on a subdomain such as `send.odevelle.com` | Keeps marketing mail and app mail reputations separate. |

## 5. If the domain is ever moved from another DNS host

1. Export the full zone (MX, SPF/DKIM/DMARC TXT, verification TXT records, CNAMEs).
2. Recreate every record in Vercel DNS first.
3. Lower the TTLs 24–48 hours ahead.
4. Switch the nameservers.
5. Verify with `dig MX odevelle.com`, `dig TXT odevelle.com`, `dig TXT _dmarc.odevelle.com` and a test email both ways.

## 6. Related infrastructure decision

Supabase project region: **Central EU (Frankfurt), `eu-central-1`**, chosen for the EU, UK and GCC
markets. A Supabase project can't change region in place; moving later means creating a new
project and migrating the data and storage, so treat this as permanent.
