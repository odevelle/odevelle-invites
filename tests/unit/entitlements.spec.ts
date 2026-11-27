import { expect, test } from "@playwright/test";
import { CATALOGUE_DESIGN_IDS, designLabels } from "@/designs/catalogue";
import { allDesignDefinitions, latestDesignVersion, registeredVersions, resolveDesignDefinition } from "@/designs/registry";
import { entitlementsFor, packageEntitlements } from "@/invitation/entitlements/packages";
import { checkEntitlements, resolveEffectiveFeatures } from "@/invitation/entitlements/resolve";
import type { BaseAppearance } from "@/invitation/schema/appearance";
import { FEATURE_KEYS } from "@/invitation/schema/features";

const royal = resolveDesignDefinition("royal-luxury", 1)!;

test.describe("design registry", () => {
  test("registers the four catalogue designs, each with a label", () => {
    expect([...new Set(allDesignDefinitions().map((d) => d.id))].sort()).toEqual([...CATALOGUE_DESIGN_IDS].sort());
    for (const id of CATALOGUE_DESIGN_IDS) expect(designLabels[id].displayName).toMatch(/Theme$/);
    expect(designLabels.beach.displayName).toBe("Destination Beach Theme");
    expect(latestDesignVersion("portuguese")).toBe(2);
    expect(latestDesignVersion("royal-luxury")).toBe(2);
  });

  test("every definition has a theme component and vice versa, with matching ids and versions", () => {
    const { definitions, loaders } = registeredVersions();
    expect(loaders).toEqual(definitions);
    for (const d of allDesignDefinitions()) {
      expect(resolveDesignDefinition(d.id, d.version)).toBe(d);
    }
  });

  test("only final designs are released; every other theme is a provisional mock", () => {
    const released = allDesignDefinitions()
      .filter((d) => d.release === "released")
      .map((d) => `${d.id}@${d.version}`);
    expect(released).toEqual(["royal-luxury@2"]);
    // New invitations get the latest version, so a released design must be the newest.
    expect(latestDesignVersion("royal-luxury")).toBe(2);
  });

  test("every design's defaults satisfy its own schemas and first preset", () => {
    for (const d of allDesignDefinitions()) {
      expect(d.optionsSchema.safeParse(d.defaults.options).success, `${d.id} options`).toBe(true);
      expect(d.appearanceSchema.safeParse(d.defaults.appearance).success, `${d.id} appearance`).toBe(true);
      expect((d.defaults.appearance as BaseAppearance).palette, `${d.id} preset`).toEqual(d.palettePresets[0].palette);
    }
  });

  test("lookups are allowlist-only", () => {
    expect(resolveDesignDefinition("royal-luxury", 1)?.id).toBe("royal-luxury");
    expect(resolveDesignDefinition("royal-luxury", 1.5)).toBeNull();
    expect(resolveDesignDefinition("constructor", 1)).toBeNull();
    expect(resolveDesignDefinition("__proto__", 1)).toBeNull();
    expect(resolveDesignDefinition("portuguese", 99)).toBeNull();
  });
});

test.describe("package entitlements", () => {
  test("config matches the published packages", () => {
    expect(Object.keys(packageEntitlements)).toEqual(["classic", "signature", "exclusive"]);
    // From the pricing comparison: music, gallery and story start at Signature.
    expect(entitlementsFor("classic").features).toMatchObject({ music: false, gallery: false, story: false, rsvp: true });
    expect(entitlementsFor("signature").features).toMatchObject({ music: true, gallery: true, story: true });
    // Bespoke designs are Exclusive only.
    expect(entitlementsFor("signature").designTiers).not.toContain("bespoke");
    expect(entitlementsFor("exclusive").designTiers).toContain("bespoke");
  });

  test("effective features = package ∩ design ∩ invitation", () => {
    const all = resolveEffectiveFeatures("exclusive", royal, {});
    expect(Object.values(all).every(Boolean)).toBe(true);
    expect(Object.keys(all).sort()).toEqual([...FEATURE_KEYS].sort());

    const classic = resolveEffectiveFeatures("classic", royal, { music: true, maps: false });
    expect(classic.music).toBe(false); // not in package
    expect(classic.maps).toBe(false); // switched off by invitation
    expect(classic.rsvp).toBe(true);
  });

  const base = {
    design: royal,
    designOptions: royal.defaults.options,
    appearance: royal.defaults.appearance as BaseAppearance,
    features: {},
    content: { hosts: [{ displayName: "A" }] },
    galleryItemCount: 0,
  };

  test("Classic: default layout, preset palette and default fonts are accepted", () => {
    expect(checkEntitlements({ ...base, tier: "classic" })).toEqual([]);
  });

  test("Classic: custom layout, palette, fonts and premium features are flagged", () => {
    const issues = checkEntitlements({
      ...base,
      tier: "classic",
      designOptions: { intro: "lace-curtain", emblem: "crest", border: "pearls" },
      appearance: { ...base.appearance, headingFont: "bodoni-moda", palette: { ...base.appearance.palette, accent: "#000000" } },
      features: { music: true },
      galleryItemCount: 3,
      content: { hosts: [{ displayName: "A" }], customSections: [{ key: "x", title: "X", body: [{ type: "paragraph", children: [{ text: "x" }] }] }] },
    }).map((i) => i.path);
    expect(issues).toEqual(expect.arrayContaining(["designOptions", "appearance.palette", "appearance", "features.music", "media.gallery", "content.customSections"]));
  });

  test("Classic: a colourway is a colour choice, not a layout, and older options still count as default", () => {
    const v2 = resolveDesignDefinition("royal-luxury", 2)!;
    const sage = v2.palettePresets.find((p) => p.key === "sage-green")!.palette;
    const classic = { ...base, tier: "classic" as const, design: v2, appearance: v2.defaults.appearance as BaseAppearance };
    expect(checkEntitlements({ ...classic, designOptions: { colourway: "sage-green", intro: "envelope-video", timelineTimes: false }, appearance: { ...classic.appearance, palette: sage } })).toEqual([]);
    expect(checkEntitlements({ ...classic, designOptions: { intro: "envelope-video", timelineTimes: false } })).toEqual([]);
    expect(checkEntitlements({ ...classic, designOptions: { colourway: "sage-green", intro: "envelope-video", timelineTimes: true } }).map((i) => i.path)).toEqual(["designOptions"]);
  });

  test("Signature: free layout and palette, but bespoke designs are refused", () => {
    expect(
      checkEntitlements({
        ...base,
        tier: "signature",
        designOptions: { intro: "lace-curtain", emblem: "monogram", border: "lace" },
        appearance: { ...base.appearance, palette: { ...base.appearance.palette, accent: "#000000" } },
      }),
    ).toEqual([]);
    expect(checkEntitlements({ ...base, tier: "signature", design: { ...royal, tier: "bespoke" } }).map((i) => i.path)).toContain("designId");
  });
});
