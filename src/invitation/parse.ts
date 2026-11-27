import type { z } from "zod";
import { resolveDesignDefinition } from "@/designs/registry";
import type { AnyDesignDefinition } from "@/designs/types";
import { resolveEffectiveFeatures } from "./entitlements/resolve";
import type { BaseAppearance } from "./schema/appearance";
import { invitationContent, type InvitationContent } from "./schema/content";
import type { EffectiveFeatures } from "./schema/features";
import { publishedInvitationRecord, type PublishedInvitationRecord } from "./schema/published";

/** A published invitation that has passed every check and is safe to render. */
export type PublishedInvitation = Omit<PublishedInvitationRecord, "content" | "appearance" | "designOptions" | "features"> & {
  design: AnyDesignDefinition;
  content: InvitationContent;
  appearance: BaseAppearance;
  /** Validated against `design.optionsSchema`; the design narrows the type. */
  designOptions: unknown;
  /** Resolved package ∩ design ∩ invitation toggles. */
  features: EffectiveFeatures;
};

export type ParseFailure = {
  ok: false;
  reason: "invalid-record" | "unknown-design" | "invalid-content" | "invalid-design-config";
  issues: z.core.$ZodIssue[];
};

export type ParseResult = { ok: true; invitation: PublishedInvitation } | ParseFailure;

/**
 * Validates a raw database record end to end:
 *  1. the shared shape (identity, events, media, toggles),
 *  2. the design is allowlisted at the pinned version,
 *  3. content, appearance and options against that version's schemas,
 *  4. resolves effective features.
 *
 * Never throws on bad data: callers decide (the page responds 404 and logs).
 */
export function parsePublishedInvitation(raw: unknown): ParseResult {
  const base = publishedInvitationRecord.safeParse(raw);
  if (!base.success) return { ok: false, reason: "invalid-record", issues: base.error.issues };

  const record = base.data;
  const design = resolveDesignDefinition(record.designId, record.designVersion);
  if (!design) {
    return {
      ok: false,
      reason: "unknown-design",
      issues: [{ code: "custom", path: ["designId"], message: `${record.designId}@${record.designVersion} is not registered`, input: record.designId }],
    };
  }

  const content = invitationContent.safeParse(record.content);
  if (!content.success) return { ok: false, reason: "invalid-content", issues: content.error.issues };

  const appearance = design.appearanceSchema.safeParse(record.appearance);
  const options = design.optionsSchema.safeParse(record.designOptions);
  if (!appearance.success || !options.success) {
    return {
      ok: false,
      reason: "invalid-design-config",
      issues: [...(appearance.error?.issues ?? []), ...(options.error?.issues ?? [])],
    };
  }

  return {
    ok: true,
    invitation: {
      ...record,
      design,
      content: content.data,
      appearance: appearance.data,
      designOptions: options.data,
      features: resolveEffectiveFeatures(record.package, design, record.features),
    },
  };
}
