# Invitation themes

How invitation themes are built, versioned and replaced. **Royal Luxury v2** is the first released final
design; the other themes (and Royal Luxury v1) are still **provisional mocks** for building the platform.
This guide covers swapping them for the final designs.

## What a theme is

A theme **version** is one folder: `src/designs/{design-id}/v{n}/`

| File | Contents | Rules |
|---|---|---|
| `definition.ts` | ID, version, `release`, occasions, supported features, **options schema** (layout variants), **appearance schema** (allowed fonts), palette presets, defaults | No React. Used for validation and entitlements. |
| `Theme.tsx` | The theme's React entry (default export, a server component) | Receives `ThemeProps` and nothing else. |
| anything else | Sections, illustrations, client islands, `theme.css`, fonts | Entirely the theme's own. Nothing is shared unless the theme chooses to import it. |

Both are registered in `src/designs/registry.ts` under the same ID and version. A unit test fails if
a definition has no component or a component has no definition.

## The contract every theme receives

```ts
type ThemeProps = {
  invitation: InvitationView; // src/invitation/view.ts: names, dates (already in the invitation's
                              // time zone), events, map links, media URLs, content
  options: unknown;           // validated against this version's options schema; parse it to narrow
  appearance: BaseAppearance; // palette, font keys, type scale (validated)
  features: EffectiveFeatures;// what to show: package ∩ theme ∩ invitation. Never check the package.
};
```

A theme decides **how** things look: layout, components, section order, animation, fonts. It never decides
**what** an invitation contains, and it never reads the package, the database or the request.

Shared helpers in `src/designs/shared/` are optional: `appearanceVars` (palette → CSS variables),
`RichText`, `Countdown` / `useCountdown`. Final themes can use them or write their own.

**Testing convention:** mark the main blocks with `data-section="hero|countdown|events|story|gallery|custom|rsvp|music|video"`.
The E2E suite checks behaviour through these markers rather than layout, so it keeps working when the visuals change.

## Versioning rules

1. Invitations are pinned to a `design_id` + `design_version`. Adding a version never changes existing invitations.
2. A `released` version is **frozen**. Any visual change, or any change to its options or appearance schema, ships as `v{n+1}`.
3. A `provisional` version (every current mock) must **never host a customer invitation**. Publishing will refuse
   provisional versions once the dashboard exists.
4. Never import across version folders. Each version is self-contained, so a retired version can be deleted safely.
5. Never rename or reuse a design ID. Display names live in `src/designs/catalogue.ts` and can change freely.

## Replacing a mock with Melina's final design

1. Create `src/designs/{id}/v{next}/` (e.g. `royal-luxury/v2`) with `definition.ts` (`release: "released"`) and `Theme.tsx`.
2. Define the real options schema (layout variants) and appearance schema (the fonts it ships, loaded with
   `next/font` inside the folder). Keep the shape compatible with existing records, or map them in step 4.
3. Register both in `registry.ts`. New invitations use the latest version automatically.
4. Move any test or demo invitations off the provisional version, then delete the mock folder and its registry entries.
5. Run `npm run test:unit` and `npm run test:e2e`.

Nothing else changes: invitation records, slugs, content structure, entitlements, routing and RSVP links all
stay as they are.

## Styling note

The project's Turbopack Tailwind rule processes every `*.css` file as global CSS, so **CSS Modules don't work**
here (class names come out `undefined`). Themes use Tailwind utilities plus a plain `theme.css` whose class
and keyframe names carry a theme+version prefix (`pt2-tiles`, `bc1-fade-up`). Currently every theme's CSS
loads on every invitation page, so keep `theme.css` small. If final themes grow heavy CSS, revisit the Turbopack rule.

## Design sources and generated artwork

Designers' handoffs (layer exports, reference renders, videos) live in `design-sources/{design-id}/`. That folder
is git-ignored: the files are large and must never be served. The pipeline reads the layer exports and their
manifest, not the PSD itself, so the PSD needn't be kept there (Royal Luxury's 173 MB PSD was removed on
2026-11-27; ask the designer for it if a layer ever needs re-exporting). Each released theme has a script in `scripts/design-assets/` that turns the handoff into optimised web
artwork under `public/designs/{design-id}/v{n}/` (committed). Re-run it after a handoff changes:

```bash
node scripts/design-assets/royal-luxury-v2.mjs          # every asset
node scripts/design-assets/royal-luxury-v2.mjs hero     # one step
```

`psd-compositor.mjs` re-renders PSD layers from the handoff manifest (blend modes, masks, clipping). The handoff
doesn't include layer styles or adjustment layers, so each step says which source it trusts: the saved Photoshop
composite (with live-text areas rebuilt), or the layer PNGs colour-fitted to the composite.

## Royal Luxury v2 (released)

Melina's "Cherry Red" design. Source: `design-sources/royal-luxury/`. Code: `src/designs/royal-luxury/v2/`.

- **Layout.** The PSD is one 720px artboard. `--rl2-u` is one PSD pixel (viewport ÷ 720 on phones, 1px from
  720px up), and elements are placed with the PSD's own coordinates (`psd.tsx`, `assets.ts`). Sections are
  full-bleed: wide screens get mirrored paper, repeating lace and net, wider silk and a wider hill, while
  decoration that the PSD crops at the artboard edge shows in full.
- **Data mapping.** Venues come from events with a `venueName` (events at the same venue share one card and a
  combined time). Every event is a moment in the order of the day; the first `dressCode` is the dress code.
  Parents' names come from `hosts[].parents`. No story or video section exists in the design, so those features
  aren't supported; intro, story, scripture and custom-section content isn't shown.
- **Options.** `colourway` (below; default `cherry-red`). `intro`: `envelope-video` | `none`. `timelineTimes`:
  show times in the order of the day (the PSD keeps them hidden).
- **Colourways.** The same template in other ground colours: Cherry red (the PSD) and Sage green so far. Each
  colourway in `colourways.ts` has:
  - an artwork folder with Cherry red's file names (`public/designs/royal-luxury/v2/colourways/<key>/`; Cherry
    red's is the v2 folder itself);
  - a text palette, offered as the design's palette preset of the same key;
  - its own envelope intro, once the designer delivers it. Until then `intro: null`, and the invitation opens
    straight onto the page.

  `node scripts/design-assets/colourway.mjs <key>` writes the folder by moving Cherry red's burgundy to
  `recolour.to`. It moves only dark, burgundy-hued pixels; gold, pearls, peach icons, ivory paper and lace keep
  their colour. The flat CSS grounds are recoloured with the same maths (`recolour.ts`), so they match the
  artwork, and theme.css reads them as `--rl2-ground`, `--rl2-ground-silk` and so on. Any generated file can be
  replaced by one the designer makes. The colourway is a colour choice (`colourOptions`), so Classic
  invitations may pick one along with its preset palette. Preview: `/sites/chloe-shane`.
- **Fonts.** The PSD uses Classic Script MN, a commercial font that needs a webfont licence. Pinyon Script is the
  closest open-licence match, sized from the PSD's measured text; the ampersand is the PSD's own glyph, used as a
  mask. Newsreader (optical sizes) and Aboreto are as designed.
- **Motion.** No animation library: one IntersectionObserver marks reveal targets and CSS animates them. Parallax
  and the timeline's draw-on use CSS scroll-driven animations where supported. Everything respects
  `prefers-reduced-motion` (the intro then skips the video, which is never downloaded).
- **Intro video.** Paused on a poster image; buffering starts on intent (hover, focus, touch) and playback on tap.
- **Animated pearls (countdown).** `design-sources/royal-luxury/pearls_animated.mp4` was made on a cream background
  with no transparency, so the pipeline keys it (`scripts/design-assets/keyed-video.mjs`): one clean matte from the
  final frame, then per-pixel reveal and glint timings taken from every frame, saved as small transparent "time
  slices" (`public/designs/royal-luxury/v2/pearls/`, listed in `pearls.generated.ts`). CSS replays them over the
  ground colour with the video's timing: no video download, about 120 KB. Re-run `pearlsAnimation` if the video changes.
  The fixture `royal-luxury-reference` uses the PSD's placeholder copy for visual comparison with the design.
