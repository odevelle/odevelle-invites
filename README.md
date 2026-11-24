# ODEVELLE

Marketing site for `odevelle.com`, built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.
Couple invitation sites (`{slug}.odevelle.com`) will live in the same app later, in their own route group.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
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
└── content/marketing/      typed copy: designs, pricing, FAQ, navigation
```

- `ODEVELLE_Final_ Landing_Page.html` is the approved design reference. It is excluded from Tailwind's class scanning.
- Design tokens (colours, type, breakpoints, motion) are defined in `src/app/(marketing)/globals.css` under `@theme`.
- Server Components by default. Client components are only used for the mobile menu, design preview dialog,
  currency and comparison toggle, FAQ accordion, enquiry form and subscribe form.
- Motion is CSS only and is disabled under `prefers-reduced-motion`.
- The invitation mockups are separate from future tenant themes on purpose. Don't import them into invitation routes.

## Not wired up yet

- **Enquiry and subscribe forms.** They only show their confirmation states and nothing is sent. They need a server action plus an email provider and a mailing list provider.
- **Placeholder links.** `#whatsapp` (a WhatsApp click-to-chat link), `#signin`, `#privacy`, `#terms`, `#refunds` and `#demo` don't go anywhere yet.
- **Copy placeholders.** `[N]`, `[X]%`, the contact details, the testimonials and the editorial image are placeholders from the design.
