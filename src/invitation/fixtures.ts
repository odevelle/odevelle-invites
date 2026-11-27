/*
 * Fixture invitations in exactly the shape `get_published_invitation(slug)`
 * returns. They drive the renderer until Supabase is connected (Phase 4) and
 * double as test data. Fictional people and places; images live under
 * public/fixtures/{invitation id}/… to mirror the storage layout.
 *
 * Coverage:
 *  - same theme, different couples:   charlotte-henry vs amelia-oliver (royal-luxury v1)
 *  - released final design:           rafael-isabel (signature), leela-arjun (classic) on royal-luxury v2;
 *                                     chloe-shane: the same design in its Sage green colourway
 *  - same contract, every theme:      royal-luxury, portuguese, floral, beach
 *  - version pinning:                 ines-tomas (portuguese v1) vs sofia-daniel (portuguese v2)
 *  - packages:                        classic, signature, exclusive
 *  - one host, another occasion:      maya-turns-30 (birthday)
 *  - failure handling:                broken-theme, broken-content, draft-invitation
 */

import type { InvitationSource } from "./source";

const paragraph = (text: string) => ({ type: "paragraph", children: [{ text }] }) as const;

export const charlotteHenryRecord = {
  id: "6f1d6c2e-4b4f-4f3a-9a53-2f0e3c1b7a10",
  slug: "charlotte-henry",
  title: "Charlotte & Henry",
  occasion: "wedding",
  package: "signature",
  designId: "royal-luxury",
  designVersion: 1,
  locale: "en",
  timeZone: "Europe/London",
  primaryDate: "2027-06-12",
  content: {
    hosts: [{ displayName: "Charlotte" }, { displayName: "Henry" }],
    eyebrow: "Together with their families",
    invitationLine: "request the honour of your presence",
    rsvpNote: "Kindly reply by 1 May 2027",
  },
  appearance: {
    palette: { primary: "#9B1B30", secondary: "#F1E3D0", background: "#FBF4EA", accent: "#CDBB9F" },
    headingFont: "great-vibes",
    bodyFont: "manrope",
    scale: "standard",
  },
  designOptions: { intro: "envelope", emblem: "monogram", border: "pearls" },
  // Asks for music, but Classic doesn't include it: the renderer drops it.
  features: { music: true },
  publishedAt: "2026-11-20T10:15:30.123456+00:00",
  events: [
    {
      id: "0b6a3d61-5f1e-4c1a-8d0e-6f7a2b9c4d11",
      kind: "ceremony",
      title: "The Ceremony",
      startsAt: "2027-06-12T14:00:00+00:00",
      endsAt: "2027-06-12T15:00:00+00:00",
      venueName: "The Grand Ballroom",
      address: "Bath, United Kingdom",
      latitude: 51.3811,
      longitude: -2.359,
      mapUrl: null,
      dressCode: "Black tie",
      notes: null,
      rsvpEnabled: true,
      sortOrder: 0,
    },
  ],
  media: [],
} as const;

const ameliaOliverRecord = {
  id: "beff90bf-c77c-4169-8066-235d14a28d2c",
  slug: "amelia-oliver",
  title: "Amelia & Oliver",
  occasion: "wedding",
  package: "signature",
  designId: "royal-luxury",
  designVersion: 1,
  locale: "en-GB",
  timeZone: "Europe/London",
  primaryDate: "2027-09-04",
  content: {
    hosts: [{ displayName: "Amelia" }, { displayName: "Oliver" }],
    eyebrow: "With joy in their hearts",
    invitationLine: "invite you to celebrate their marriage",
    story: {
      title: "Our story",
      body: [paragraph("We met over a borrowed umbrella in Edinburgh, and have been sharing one ever since.")],
    },
    closingMessage: "We can’t wait to celebrate with you.",
  },
  // Same theme as Charlotte & Henry, different personalisation (Signature allows it).
  appearance: {
    palette: { primary: "#1c2a4a", secondary: "#e9d8b0", background: "#f6f3ec", accent: "#c7a45a" },
    headingFont: "bodoni-moda",
    bodyFont: "bodoni-moda",
    scale: "compact",
  },
  designOptions: { intro: "lace-curtain", emblem: "monogram", border: "lace" },
  features: {},
  publishedAt: "2026-11-22T09:00:00+00:00",
  events: [
    {
      id: "1381fdd9-e746-4c49-aa00-3f3fc0010b51",
      kind: "ceremony",
      title: "Ceremony",
      startsAt: "2027-09-04T13:30:00+01:00",
      endsAt: null,
      venueName: "St Giles’ Cathedral",
      address: "Edinburgh, United Kingdom",
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: null,
      notes: null,
      rsvpEnabled: true,
      sortOrder: 0,
    },
    {
      id: "7fa2bc1f-e72c-46ab-9bb8-43081f643036",
      kind: "reception",
      title: "Dinner & dancing",
      startsAt: "2027-09-04T18:00:00+01:00",
      endsAt: "2027-09-04T23:59:00+01:00",
      venueName: "The Signet Library",
      address: null,
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: "Black tie optional",
      notes: null,
      rsvpEnabled: true,
      sortOrder: 1,
    },
  ],
  media: [
    { id: "68205c09-d5a7-4dbb-bf32-d95871ca855f", kind: "gallery", path: "beff90bf-c77c-4169-8066-235d14a28d2c/gallery/a1.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "Amelia and Oliver in Edinburgh", blurDataUrl: null, sortOrder: 0 },
    { id: "e5d248f6-1fc5-4076-aabb-41d5c9209cdc", kind: "gallery", path: "beff90bf-c77c-4169-8066-235d14a28d2c/gallery/a2.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "The proposal on Arthur’s Seat", blurDataUrl: null, sortOrder: 1 },
  ],
} as const;

export const inesTomasRecord = {
  id: "9a2c7e14-3d5b-4e8f-b1a6-7c0d2e4f6a21",
  slug: "ines-tomas",
  title: "Inês & Tomás",
  occasion: "wedding",
  package: "signature",
  designId: "portuguese",
  designVersion: 1,
  locale: "en",
  timeZone: "Asia/Kolkata",
  primaryDate: "2028-01-21",
  content: {
    hosts: [{ displayName: "Inês" }, { displayName: "Tomás" }],
    scripture: { text: "Many waters cannot quench love", reference: "Song of Solomon 8:7" },
    story: {
      title: "How we met",
      body: [{ type: "paragraph", children: [{ text: "At a friend’s wedding, " }, { text: "of course", marks: ["em"] }, { text: "." }] }],
    },
  },
  appearance: {
    palette: { primary: "#1f4e8c", secondary: "#13305c", background: "#fdfaf3", accent: "#e8b83a" },
    headingFont: "great-vibes",
    bodyFont: "manrope",
    scale: "large",
  },
  designOptions: { intro: "tile-reveal", tiles: "full-frame", showScripture: true },
  features: {},
  publishedAt: "2026-11-21T08:00:00+00:00",
  events: [
    {
      id: "4c8e1f20-7a3b-4d5c-9e6f-1a2b3c4d5e31",
      kind: "ceremony",
      title: "Nuptial Mass",
      startsAt: "2028-01-21T10:30:00+05:30",
      endsAt: null,
      venueName: "Chapel",
      address: null,
      latitude: null,
      longitude: null,
      mapUrl: "https://maps.example.com/?q=chapel",
      dressCode: null,
      notes: null,
      rsvpEnabled: true,
      sortOrder: 0,
    },
    {
      id: "5d9f2a31-8b4c-4e6d-af70-2b3c4d5e6f42",
      kind: "reception",
      title: "Reception",
      startsAt: "2028-01-21T19:00:00+05:30",
      endsAt: "2028-01-21T23:30:00+05:30",
      venueName: null,
      address: null,
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: null,
      notes: null,
      rsvpEnabled: true,
      sortOrder: 1,
    },
  ],
  media: [
    {
      id: "7e1a3b42-9c5d-4f7e-b081-3c4d5e6f7a53",
      kind: "gallery",
      path: "9a2c7e14-3d5b-4e8f-b1a6-7c0d2e4f6a21/gallery/2f6c1d.webp",
      mimeType: "image/webp",
      width: 1600,
      height: 1067,
      durationMs: null,
      alt: "Inês and Tomás on the beach at sunset",
      blurDataUrl: null,
      sortOrder: 0,
    },
  ],
} as const;

/** Same theme as Inês & Tomás, but pinned to version 2. */
const sofiaDanielRecord = {
  id: "48063db2-e647-48f2-b5e3-47b5f8da0363",
  slug: "sofia-daniel",
  title: "Sofía & Daniel",
  occasion: "wedding",
  package: "signature",
  designId: "portuguese",
  designVersion: 2,
  locale: "en",
  timeZone: "Europe/Lisbon",
  primaryDate: "2027-07-17",
  content: {
    hosts: [{ displayName: "Sofía" }, { displayName: "Daniel" }],
    scripture: { text: "Love bears all things", reference: "1 Corinthians 13:7" },
    invitationLine: "invite you to their wedding in Sintra",
  },
  appearance: {
    palette: { primary: "#2f5da8", secondary: "#1f3f7a", background: "#fbf8f1", accent: "#e8b83a" },
    headingFont: "bodoni-moda",
    bodyFont: "manrope",
    scale: "standard",
  },
  designOptions: { intro: "tile-reveal", layout: "side-tiles", showScripture: true },
  features: { music: false },
  publishedAt: "2026-11-23T12:00:00+00:00",
  events: [
    {
      id: "3ce6b8af-0ac7-45b8-9968-a454bcaaef93",
      kind: "ceremony",
      title: "Ceremony",
      startsAt: "2027-07-17T16:00:00+01:00",
      endsAt: null,
      venueName: "Quinta da Regaleira",
      address: "Sintra, Portugal",
      latitude: 38.7963,
      longitude: -9.3961,
      mapUrl: null,
      dressCode: null,
      notes: null,
      rsvpEnabled: true,
      sortOrder: 0,
    },
  ],
  media: [
    { id: "52445c62-6586-4fc3-a34f-63d04768dbeb", kind: "gallery", path: "48063db2-e647-48f2-b5e3-47b5f8da0363/gallery/s1.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "Sofía and Daniel in Lisbon", blurDataUrl: null, sortOrder: 0 },
  ],
} as const;

const eliseJulienRecord = {
  id: "ff580049-65cf-40e8-b9b7-8910164cccd2",
  slug: "elise-julien",
  title: "Élise & Julien",
  occasion: "wedding",
  package: "exclusive",
  designId: "floral",
  designVersion: 1,
  locale: "en",
  timeZone: "Europe/Paris",
  primaryDate: "2027-05-05",
  content: {
    hosts: [{ displayName: "Élise", fullName: "Élise Moreau" }, { displayName: "Julien", fullName: "Julien Laurent" }],
    eyebrow: "Our wedding day",
    intro: [paragraph("Join us for a long lunch among the olive trees, followed by dancing until late.")],
    story: { body: [paragraph("Ten years, three cities and one very patient cat later, we’re getting married.")] },
    customSections: [
      { key: "travel", title: "Getting to Provence", body: [paragraph("The nearest airport is Marseille. We’ve reserved a shuttle from Aix-en-Provence station.")] },
    ],
    rsvpNote: "Merci de répondre avant le 1er avril",
  },
  appearance: {
    palette: { primary: "#6f8460", secondary: "#3f5236", background: "#f8f6ee", accent: "#e3c77a" },
    headingFont: "great-vibes",
    bodyFont: "bodoni-moda",
    scale: "large",
  },
  designOptions: { intro: "petal-fall", garland: "corners", texture: "linen" },
  features: {},
  publishedAt: "2026-11-24T15:30:00+00:00",
  events: [
    {
      id: "62f06959-ec67-4adc-b81d-b01ce928ec5e",
      kind: "ceremony",
      title: "Garden ceremony",
      startsAt: "2027-05-05T12:00:00+02:00",
      endsAt: "2027-05-05T13:00:00+02:00",
      venueName: "Domaine des Oliviers",
      address: "Provence, France",
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: "Garden formal",
      notes: null,
      rsvpEnabled: true,
      sortOrder: 0,
    },
    {
      id: "a2ab31c3-4a54-4fda-b32a-7f4c2cddb863",
      kind: "party",
      title: "Dancing",
      startsAt: "2027-05-05T20:00:00+02:00",
      endsAt: null,
      venueName: "The Orangery",
      address: null,
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: null,
      notes: "Bring comfortable shoes.",
      rsvpEnabled: false,
      sortOrder: 1,
    },
  ],
  media: [
    { id: "0183d613-9b40-4a87-af13-62673c04161f", kind: "gallery", path: "ff580049-65cf-40e8-b9b7-8910164cccd2/gallery/e1.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "Élise and Julien in Paris", blurDataUrl: null, sortOrder: 0 },
    { id: "a18befff-bc7f-4038-89dd-b27790733a55", kind: "gallery", path: "ff580049-65cf-40e8-b9b7-8910164cccd2/gallery/e2.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "Our first apartment in Lyon", blurDataUrl: null, sortOrder: 1 },
    { id: "2e6fa392-4182-48e7-b1b8-ddbba677a440", kind: "gallery", path: "ff580049-65cf-40e8-b9b7-8910164cccd2/gallery/e3.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "The olive grove at the venue", blurDataUrl: null, sortOrder: 2 },
  ],
} as const;

const chiaraLorenzoRecord = {
  id: "7ca5241f-1eb8-4432-87c5-4904f8968d6c",
  slug: "chiara-lorenzo",
  title: "Chiara & Lorenzo",
  occasion: "wedding",
  package: "signature",
  designId: "beach",
  designVersion: 1,
  locale: "en",
  timeZone: "Europe/Rome",
  primaryDate: "2027-09-18",
  content: {
    hosts: [{ displayName: "Chiara" }, { displayName: "Lorenzo" }],
    eyebrow: "Save the date",
    invitationLine: "for a wedding by the sea",
    story: { title: "From Milan to the coast", body: [paragraph("We traded city lights for a little house by the sea, and now we want to share it with you.")] },
  },
  appearance: {
    palette: { primary: "#1f4e52", secondary: "#5e9e9e", background: "#fbf3e4", accent: "#c99a86" },
    headingFont: "bodoni-moda",
    bodyFont: "manrope",
    scale: "standard",
  },
  designOptions: { intro: "wave-reveal", waves: "calm", emblem: "scallop" },
  features: {},
  publishedAt: "2026-11-24T18:00:00+00:00",
  events: [
    {
      id: "c3d96ab8-50b8-4fb6-b3f0-79fd9f3887a5",
      kind: "welcome",
      title: "Welcome aperitivo",
      startsAt: "2027-09-17T19:00:00+02:00",
      endsAt: null,
      venueName: "Bar del Porto",
      address: "Amalfi, Italy",
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: null,
      notes: null,
      rsvpEnabled: false,
      sortOrder: 0,
    },
    {
      id: "75d22ccb-9616-4842-9b05-5b72195ae773",
      kind: "ceremony",
      title: "Beach ceremony",
      startsAt: "2027-09-18T17:00:00+02:00",
      endsAt: "2027-09-18T18:00:00+02:00",
      venueName: "Spiaggia di Santa Croce",
      address: "Amalfi, Italy",
      latitude: 40.6276,
      longitude: 14.5862,
      mapUrl: null,
      dressCode: "Barefoot welcome",
      notes: null,
      rsvpEnabled: true,
      sortOrder: 1,
    },
  ],
  media: [
    { id: "2022f036-eb15-43f0-8783-6ca4fa847787", kind: "hero", path: "7ca5241f-1eb8-4432-87c5-4904f8968d6c/hero/h1.webp", mimeType: "image/webp", width: 2000, height: 1200, durationMs: null, alt: "The Amalfi coast at golden hour", blurDataUrl: null, sortOrder: 0 },
    { id: "2ce775ac-b1ed-4621-9abe-d8bb41e7d590", kind: "gallery", path: "7ca5241f-1eb8-4432-87c5-4904f8968d6c/gallery/c1.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "Chiara and Lorenzo on a boat", blurDataUrl: null, sortOrder: 0 },
    { id: "0d473d9b-75a4-4feb-9637-37f059acf86d", kind: "gallery", path: "7ca5241f-1eb8-4432-87c5-4904f8968d6c/gallery/c2.webp", mimeType: "image/webp", width: 1600, height: 1067, durationMs: null, alt: "Lemons from the terrace", blurDataUrl: null, sortOrder: 1 },
  ],
} as const;

/**
 * Royal Luxury v2 (released) demo, laid out like Melina's PSD: parents under
 * the names, a church and a reception venue, five moments in the order of
 * the day, a dress code, gallery photos for the scratch card.
 */
const rafaelIsabelRecord = {
  id: "c5fc827d-5b16-4778-9d3e-6f8bb2f7ed03",
  slug: "rafael-isabel",
  title: "Rafael & Isabel",
  occasion: "wedding",
  package: "signature",
  designId: "royal-luxury",
  designVersion: 2,
  locale: "en-GB",
  timeZone: "Asia/Kolkata",
  primaryDate: "2027-12-10",
  content: {
    hosts: [
      { displayName: "Rafael", parents: ["Mr Anthony Fernandes", "Mrs Maria Fernandes"] },
      { displayName: "Isabel", parents: ["Mr Joseph D’Souza", "Mrs Clara D’Souza"] },
    ],
    rsvpNote: "Kindly reply by 10 November 2027",
    closingMessage: "With love and gratitude, we look forward to celebrating with you.",
  },
  appearance: {
    palette: { primary: "#5c0008", secondary: "#fce8d8", background: "#ffecdd", accent: "#cc9e63" },
    headingFont: "pinyon-script",
    bodyFont: "newsreader",
    scale: "standard",
  },
  designOptions: { intro: "envelope-video", timelineTimes: false },
  features: {},
  publishedAt: "2026-11-26T12:00:00+00:00",
  events: [
    { id: "65ac96b9-d84e-40ac-ac14-e77d53a15e47", kind: "welcome", title: "Guests to arrive", startsAt: "2027-12-10T14:45:00+05:30", endsAt: null, venueName: null, address: null, latitude: null, longitude: null, mapUrl: null, dressCode: null, notes: null, rsvpEnabled: false, sortOrder: 0 },
    { id: "c41f731e-7cdd-45d8-a703-a6ccf8606adf", kind: "ceremony", title: "Ceremony commences", startsAt: "2027-12-10T15:00:00+05:30", endsAt: "2027-12-10T16:30:00+05:30", venueName: "Our Lady of Grace Church", address: "Panjim, Goa", latitude: 15.4989, longitude: 73.8278, mapUrl: null, dressCode: "Formal attire", notes: null, rsvpEnabled: true, sortOrder: 1 },
    { id: "1355a59c-8b58-4fbe-85e0-005a15442a22", kind: "reception", title: "Cocktail hour & dinner", startsAt: "2027-12-10T17:00:00+05:30", endsAt: "2027-12-10T18:00:00+05:30", venueName: "Villa Bougainvillea", address: "Candolim, Goa", latitude: 15.5167, longitude: 73.7619, mapUrl: null, dressCode: null, notes: null, rsvpEnabled: true, sortOrder: 2 },
    { id: "a9b3575a-53d5-4559-9408-b004168e50fb", kind: "party", title: "Reception & dancing", startsAt: "2027-12-10T18:00:00+05:30", endsAt: "2027-12-10T20:00:00+05:30", venueName: "Villa Bougainvillea", address: "Candolim, Goa", latitude: 15.5167, longitude: 73.7619, mapUrl: null, dressCode: null, notes: null, rsvpEnabled: false, sortOrder: 3 },
    { id: "dd9581b7-2089-4552-93c3-1a743699169b", kind: "other", title: "Last dance", startsAt: "2027-12-10T20:00:00+05:30", endsAt: null, venueName: "Villa Bougainvillea", address: null, latitude: null, longitude: null, mapUrl: null, dressCode: null, notes: null, rsvpEnabled: false, sortOrder: 4 },
  ],
  media: [
    { id: "5013d575-3d7f-48f2-8359-824e14b986e4", kind: "gallery", path: "c5fc827d-5b16-4778-9d3e-6f8bb2f7ed03/gallery/r1.webp", mimeType: "image/webp", width: 1200, height: 1560, durationMs: null, alt: "Rafael and Isabel at sunset in Fontainhas", blurDataUrl: null, sortOrder: 0 },
    { id: "384f1819-779b-45b4-8da5-9e9b3161d3f5", kind: "gallery", path: "c5fc827d-5b16-4778-9d3e-6f8bb2f7ed03/gallery/r2.webp", mimeType: "image/webp", width: 1200, height: 1560, durationMs: null, alt: "The proposal on Miramar beach", blurDataUrl: null, sortOrder: 1 },
  ],
} as const;

/**
 * Royal Luxury v2 with the PSD's own placeholder copy ("Groom", "Church Name",
 * "10 . 12 . 2026"…), so the page can be compared with the design pixel for pixel.
 */
const royalLuxuryReferenceRecord = {
  ...rafaelIsabelRecord,
  id: "72921f33-75ac-4a4b-abf8-b43c98eb896c",
  slug: "royal-luxury-reference",
  title: "Groom & Bride",
  locale: "en-GB",
  primaryDate: "2026-12-10",
  content: {
    hosts: [
      { displayName: "Groom", parents: ["Groom Father", "Groom Mother"] },
      { displayName: "Bride", parents: ["Bride Father", "Bride Mother"] },
    ],
  },
  events: [
    { ...rafaelIsabelRecord.events[0], title: "Guest to arrive", startsAt: "2026-12-10T14:45:00+05:30" },
    { ...rafaelIsabelRecord.events[1], startsAt: "2026-12-10T15:00:00+05:30", endsAt: "2026-12-10T16:30:00+05:30", venueName: "Church Name", address: "Place of the Church" },
    { ...rafaelIsabelRecord.events[2], startsAt: "2026-12-10T17:00:00+05:30", endsAt: "2026-12-10T18:00:00+05:30", venueName: "Reception Name", address: "Place of the Reception" },
    { ...rafaelIsabelRecord.events[3], startsAt: "2026-12-10T18:00:00+05:30", endsAt: "2026-12-10T20:00:00+05:30", venueName: "Reception Name", address: "Place of the Reception" },
    { ...rafaelIsabelRecord.events[4], startsAt: "2026-12-10T20:00:00+05:30", venueName: "Reception Name" },
  ],
  media: [],
  designOptions: { intro: "none", timelineTimes: false },
} as const;

/**
 * Royal Luxury v2 in another colourway: the same template, Sage green
 * (options.colourway). Its envelope video isn't delivered yet, so it opens
 * straight onto the page.
 */
const chloeShaneRecord = {
  ...rafaelIsabelRecord,
  id: "1c400235-5c54-4e84-8a65-4d11fcbdcca7",
  slug: "chloe-shane",
  title: "Chloe & Shane",
  primaryDate: "2027-09-18",
  content: {
    hosts: [
      { displayName: "Shane", parents: ["Mr Peter Rodrigues", "Mrs Anita Rodrigues"] },
      { displayName: "Chloe", parents: ["Mr Michael Pereira", "Mrs Sandra Pereira"] },
    ],
    rsvpNote: "Kindly reply by 18 August 2027",
    closingMessage: "With love, we can’t wait to celebrate with you.",
  },
  appearance: {
    palette: { primary: "#4a5a44", secondary: "#fce8d8", background: "#ffecdd", accent: "#cc9e63" },
    headingFont: "pinyon-script",
    bodyFont: "newsreader",
    scale: "standard",
  },
  designOptions: { colourway: "sage-green", intro: "envelope-video", timelineTimes: false },
  // A meal question.
  rsvpSettings: { mealOptions: ["Vegetarian", "Non-vegetarian"] },
  events: [
    { ...rafaelIsabelRecord.events[0], id: "540ca525-f5d8-44bb-8a2f-48fac27246b5", startsAt: "2027-09-18T15:45:00+05:30" },
    { ...rafaelIsabelRecord.events[1], id: "e36cdbfb-fea0-429f-9e94-e756af18b854", startsAt: "2027-09-18T16:00:00+05:30", endsAt: "2027-09-18T17:15:00+05:30", venueName: "St Francis Xavier Church", address: "Old Goa", dressCode: "Black tie" },
    { ...rafaelIsabelRecord.events[2], id: "f988cea0-b087-4111-8e8c-061e363ef83c", startsAt: "2027-09-18T18:00:00+05:30", endsAt: "2027-09-18T19:00:00+05:30", venueName: "The Olive Grove", address: "Assagao, Goa" },
    { ...rafaelIsabelRecord.events[3], id: "fde0b5f6-e0fa-4a27-8d0b-8e0956fa22f5", startsAt: "2027-09-18T19:00:00+05:30", endsAt: "2027-09-18T22:00:00+05:30", venueName: "The Olive Grove", address: "Assagao, Goa" },
    { ...rafaelIsabelRecord.events[4], id: "e4b56ce2-2316-4530-9ce5-d903465d94d7", startsAt: "2027-09-18T22:00:00+05:30", venueName: "The Olive Grove" },
  ],
  media: [
    // Each invitation owns its own media folder (enforced by the database), so these are copies.
    { ...rafaelIsabelRecord.media[0], id: "be804674-c8e1-4949-84b2-28d962ad6172", path: "1c400235-5c54-4e84-8a65-4d11fcbdcca7/gallery/r1.webp", alt: "Chloe and Shane" },
    { ...rafaelIsabelRecord.media[1], id: "ea4c534d-1d11-4bd1-b71d-856f9c31cbe8", path: "1c400235-5c54-4e84-8a65-4d11fcbdcca7/gallery/r2.webp", alt: "The proposal" },
  ],
} as const;

/** Royal Luxury v2 on Classic: default layout, one venue, no parents, no dress code, no gallery (the scratch card reveals the date). */
const leelaArjunRecord = {
  id: "504ab394-dd04-42af-8e1f-cce2877cc9ee",
  slug: "leela-arjun",
  title: "Leela & Arjun",
  occasion: "engagement",
  package: "classic",
  designId: "royal-luxury",
  designVersion: 2,
  locale: "en",
  timeZone: "Europe/London",
  primaryDate: "2027-05-22",
  content: {
    hosts: [{ displayName: "Leela" }, { displayName: "Arjun" }],
    eyebrow: "Together with their families",
    invitationLine: "invite you to celebrate their engagement",
  },
  appearance: {
    palette: { primary: "#5c0008", secondary: "#fce8d8", background: "#ffecdd", accent: "#cc9e63" },
    headingFont: "pinyon-script",
    bodyFont: "newsreader",
    scale: "standard",
  },
  designOptions: { intro: "envelope-video", timelineTimes: false },
  features: {},
  // A meal question with three options.
  rsvpSettings: { mealOptions: ["Vegetarian", "Non-vegetarian", "Vegan"] },
  publishedAt: "2026-11-26T12:30:00+00:00",
  events: [
    { id: "c0ddf64f-0b73-4589-94c8-6df045ffb5ac", kind: "party", title: "Engagement dinner", startsAt: "2027-05-22T19:00:00+01:00", endsAt: "2027-05-22T23:00:00+01:00", venueName: "The Orangery at Kew", address: "Richmond, London", latitude: null, longitude: null, mapUrl: null, dressCode: null, notes: null, rsvpEnabled: true, sortOrder: 0 },
  ],
  media: [],
} as const;

/** One host, a birthday, Classic: the contract isn't wedding-shaped. */
const mayaRecord = {
  id: "b4370096-2972-4a9e-92fa-fd72d9cdc5ef",
  slug: "maya-turns-30",
  title: "Maya turns 30",
  occasion: "birthday",
  package: "classic",
  designId: "beach",
  designVersion: 1,
  locale: "en-US",
  timeZone: "America/New_York",
  primaryDate: "2027-03-06",
  content: {
    hosts: [{ displayName: "Maya" }],
    eyebrow: "You’re invited",
    invitationLine: "to a 30th birthday weekend",
  },
  appearance: {
    palette: { primary: "#1f4e52", secondary: "#5e9e9e", background: "#fbf3e4", accent: "#c99a86" },
    headingFont: "bodoni-moda",
    bodyFont: "manrope",
    scale: "standard",
  },
  designOptions: { intro: "envelope", waves: "layered", emblem: "scallop" },
  features: { countdown: false },
  publishedAt: "2026-11-25T14:00:00+00:00",
  events: [
    {
      id: "5fc77622-69a8-48f9-918b-1edd4969bb87",
      kind: "party",
      title: "Sunset party",
      startsAt: "2027-03-06T18:00:00-05:00",
      endsAt: null,
      venueName: "The Boathouse",
      address: "Miami, Florida",
      latitude: null,
      longitude: null,
      mapUrl: null,
      dressCode: "Summer whites",
      notes: null,
      rsvpEnabled: true,
      sortOrder: 0,
    },
  ],
  media: [],
} as const;

/** Points at a theme that isn't registered: must render "unavailable", never crash or guess. */
const brokenThemeRecord = {
  ...charlotteHenryRecord,
  id: "1f095adf-32f4-4430-b0be-8fc3cc659787",
  slug: "broken-theme",
  designId: "theatre",
  events: [],
} as const;

/** Content that fails validation (no hosts): must render "unavailable". */
const brokenContentRecord = {
  ...charlotteHenryRecord,
  id: "0f1db11d-efa2-4bb6-9175-0da1ea41845b",
  slug: "broken-content",
  content: { eyebrow: "Missing hosts" },
  events: [],
} as const;

/** Not published: the public read never returns it, so the page is "not found". */
const draftRecord = { ...charlotteHenryRecord, id: "cd8020a6-eb8a-4f76-b5dd-b61bd6aa0f28", slug: "draft-invitation" } as const;

/** Every fixture with its publication status (also used to generate supabase/seed.sql). */
export const fixtures: { status: "published" | "draft"; record: { slug: string } }[] = [
  { status: "published", record: charlotteHenryRecord },
  { status: "published", record: ameliaOliverRecord },
  { status: "published", record: inesTomasRecord },
  { status: "published", record: sofiaDanielRecord },
  { status: "published", record: eliseJulienRecord },
  { status: "published", record: chiaraLorenzoRecord },
  { status: "published", record: mayaRecord },
  { status: "published", record: rafaelIsabelRecord },
  { status: "published", record: leelaArjunRecord },
  { status: "published", record: royalLuxuryReferenceRecord },
  { status: "published", record: chloeShaneRecord },
  { status: "published", record: brokenThemeRecord },
  { status: "published", record: brokenContentRecord },
  { status: "draft", record: draftRecord },
];

/** Slugs of the fixtures that should render successfully. */
export const RENDERABLE_FIXTURE_SLUGS = [
  "charlotte-henry",
  "amelia-oliver",
  "ines-tomas",
  "sofia-daniel",
  "elise-julien",
  "chiara-lorenzo",
  "maya-turns-30",
  "rafael-isabel",
  "leela-arjun",
  "royal-luxury-reference",
  "chloe-shane",
] as const;

/** Behaves like the database read: only published records, returned as plain JSON. */
export const fixtureSource: InvitationSource = {
  async getPublishedRecord(slug) {
    const found = fixtures.find((f) => f.status === "published" && f.record.slug === slug);
    return found ? structuredClone(found.record) : null;
  },
  mediaUrl: (path) => `/fixtures/${path}`,
};
