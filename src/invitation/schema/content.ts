import { z } from "zod";
import { richText, text } from "./primitives";

/*
 * Invitation copy (`invitations.content`). Design-neutral: every design reads
 * the same fields and decides how to present them. Design-specific choices
 * live in `design_options`, not here.
 *
 * Strict objects: unknown keys are rejected, so schema drift surfaces as a
 * validation error instead of silently-ignored data.
 */

const host = z.strictObject({
  /** How the name appears on the invitation, e.g. "Charlotte". */
  displayName: text(80),
  /** Optional full name for formal lines and RSVP emails. */
  fullName: text(160).optional(),
  /**
   * Parents' names, shown under the host's name by designs that feature them
   * (e.g. Royal Luxury). One line each: ["Mr Joseph D'Souza", "Mrs Clara D'Souza"],
   * or a single line: ["Mr & Mrs D'Souza"].
   */
  parents: z.array(text(120)).min(1).max(2).optional(),
});

const scripture = z.strictObject({
  text: text(400),
  reference: text(80),
});

/** Exclusive only (enforced by entitlements): bespoke sections with free headings. */
const customSection = z.strictObject({
  key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(40),
  title: text(120),
  body: richText,
});

export const invitationContent = z.strictObject({
  /** Couple, celebrant(s) or hosting family. 1 for a birthday, 2 for most weddings. */
  hosts: z.array(host).min(1).max(4),
  /** Short line above the names, e.g. "Together with their families". */
  eyebrow: text(120).optional(),
  /** Line under the names, e.g. "request the honour of your presence". */
  invitationLine: text(200).optional(),
  intro: richText.optional(),
  story: z.strictObject({ title: text(120).optional(), body: richText }).optional(),
  /** Used by designs that feature a verse (e.g. Portuguese). */
  scripture: scripture.optional(),
  closingMessage: text(500).optional(),
  /** Shown beside the RSVP form, e.g. "Kindly reply by 1 May". */
  rsvpNote: text(300).optional(),
  customSections: z.array(customSection).max(8).optional(),
});

export type InvitationContent = z.infer<typeof invitationContent>;
