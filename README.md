# ODEVELLE

Marketing site for `odevelle.com`, built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.
Couple invitation sites (`{slug}.odevelle.com`) will live in the same app later, in their own route group.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
npm run typecheck
npm run test:unit   # platform logic + database tests (no browser, no server)
npm run test:db     # just the database: migrations, RLS, constraints, storage policies on real Postgres (PGlite)
```

## End-to-end tests (Playwright)

```bash
npx playwright install chromium webkit   # once per machine
npm run test:e2e          # builds, serves on :3100 and runs every project
npm run test:e2e:ui       # interactive runner
npm run test:e2e:report   # open the last HTML report
npx playwright test --project=mobile-safari e2e/collection.spec.ts   # one project or file
E2E_BASE_URL=https://preview-url.vercel.app npm run test:e2e        # test a deployed preview
```

- Projects: `desktop-chromium` (1440×900), `mobile-chromium` (390×844) and `mobile-safari` (iPhone 13, WebKit).
- Tests live in `e2e/`. Import `test`/`expect` from `e2e/fixtures.ts`: it fails any test that logs a console error or throws an uncaught exception.
- The suite covers page structure, overflow, font self-hosting, reduced motion, header and mobile menu, the sticky mobile bar, the collection and preview dialog (including choose → form pre-fill), currency and comparison, the FAQ, and both forms (UI only, since they have no backend yet).

## Structure

```
src/
├── app/(marketing)/        root layout (fonts, metadata), landing page, /features page, globals.css (design tokens)
├── components/marketing/   landing page sections and their small client islands
│   └── invite-mockup/      illustrated invitation previews (marketing artwork only)
├── content/marketing/      typed copy: designs, pricing, FAQ, navigation
├── invitation/             platform domain layer (no UI): Zod schemas, parsing, entitlements, fixtures, data sources
├── designs/                invitation design catalogue + allowlisted, versioned registry
├── lib/                    env validation (server-only), tenant host/slug parsing and routing rules
└── proxy.ts                multi-tenant routing: {slug}.odevelle.com → /sites/{slug}
scripts/design-assets/      turn a designer's handoff into optimised theme artwork (see docs/themes.md)
scripts/db/                 upload demo media to Supabase Storage (dev/preview projects only)
design-sources/             designers' PSDs and layer exports (git-ignored, never served)
supabase/migrations/        version-controlled SQL (tested locally, not yet applied; see docs/supabase.md)
supabase/seed.sql           demo invitations, generated from the fixtures (never load into production)
docs/                       supabase.md, themes.md, domain-and-dns.md
tests/unit/                 unit tests for the platform layer
tests/db/                   database tests: PGlite harness, Supabase stand-ins, RLS/constraint/storage suites
```

- `ODEVELLE_Final_ Landing_Page.html` is the approved design reference. It is excluded from Tailwind's class scanning.
- Design tokens (colours, type, breakpoints, motion) are defined in `src/app/(marketing)/globals.css` under `@theme`.
- Server Components by default. Client components are only used for the mobile menu, design preview dialog,
  currency and comparison toggle, FAQ accordion, enquiry form and subscribe form.
- Motion is CSS only and is disabled under `prefers-reduced-motion`.
- The invitation mockups are separate from future tenant themes on purpose. Don't import them into invitation routes.

## Invitation platform (in progress)

Each invitation is served at `{slug}.odevelle.com` from this same app. Key rules:

- **Design IDs are permanent.** `royal-luxury`, `portuguese`, `floral` and `beach` are stored in the database. Display names live separately in `src/designs/catalogue.ts` and can change freely.
- **Designs are allowlisted and versioned.** The database never chooses code: `src/designs/registry.ts` maps `design_id` + `design_version` to a definition. Invitations stay pinned to their version.
- **Packages and designs are separate.** Package rules live only in `src/invitation/entitlements/packages.ts`. Pages receive resolved features and never check the package themselves.
- **Every read is validated.** `parsePublishedInvitation()` validates the database record against the pinned design's schemas before anything renders.
- **Guests never touch tables.** The `anon` role can only call `get_published_invitation(slug)`. RSVPs and client data are private (RLS).
- **Data source.** With `SUPABASE_URL` set, invitations come from Supabase (publishable key, RPC only) and media from the `invitation-media` Storage bucket; otherwise development uses the fixtures. Setup, migrations and the access model: [docs/supabase.md](docs/supabase.md).
- **Invitations are unlisted** (`noindex, nofollow`). That isn't access control. `access_mode = 'passcode'` is reserved for protected invitations later.
- **Each invitation has its own address.** `src/proxy.ts` serves `{slug}.odevelle.com` from `/sites/{slug}`, 404s reserved or malformed subdomains, and redirects `odevelle.com/sites/{slug}` to the subdomain. Rules and the full table: [docs/domain-and-dns.md](docs/domain-and-dns.md#3a-how-requests-are-routed).
- **Preview invitations locally:** run `npm run dev`, then open `http://charlotte-henry.localhost:3000` (exactly as guests will see it) or `/sites/charlotte-henry` (or any slug in `src/invitation/fixtures.ts`). Fixtures are served in development (when `SUPABASE_URL` isn't set) and in the E2E test server, never in a normal production build.
- **Royal Luxury v2 is the first released design;** the other themes are still provisional mocks. Preview it at `/sites/rafael-isabel` (or `/sites/royal-luxury-reference`, which uses the PSD's placeholder copy; `/sites/chloe-shane` shows the Sage green colourway). See [docs/themes.md](docs/themes.md) for the theme contract, versioning rules, the design-asset pipeline and how to swap in the final designs.

## Not wired up yet

- **Enquiry and subscribe forms.** They only show their confirmation states and nothing is sent. They need a server action plus an email provider and a mailing list provider.
- **Placeholder links.** `#whatsapp` (a WhatsApp click-to-chat link), `#signin`, `#privacy`, `#terms`, `#refunds` and `#demo` don't go anywhere yet.
- **Copy placeholders.** `[N]`, `[X]%`, the contact details, the testimonials and the editorial image are placeholders from the design.
