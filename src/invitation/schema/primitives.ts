import { z } from "zod";
import { isUsableSlug } from "@/lib/tenant/slug";

/* Shared building blocks for invitation schemas. No HTML anywhere: every
 * string here is rendered by React as text, never as markup. */

export const uuid = z.uuid();

export const slug = z.string().refine(isUsableSlug, "Invalid or reserved slug");

/** #RRGGBB, normalised to lower case. No named colours, no CSS expressions. */
export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected a #RRGGBB colour")
  .transform((v) => v.toLowerCase());

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** IANA time zone, e.g. "Europe/Madrid". */
export const timeZone = z.string().min(1).max(64).refine(isValidTimeZone, "Unknown IANA time zone");

/** ISO 8601 date-time with an explicit offset, as Postgres timestamptz serialises it. */
export const isoDateTime = z.iso.datetime({ offset: true });

/** ISO 8601 calendar date (YYYY-MM-DD). */
export const isoDate = z.iso.date();

/** Trimmed single-line text with a length cap. */
export const text = (max: number) => z.string().trim().min(1).max(max);

/** Optional field that may arrive as JSON null from the database. */
export const optional = <T extends z.ZodType>(schema: T) =>
  schema.nullish().transform((v) => v ?? undefined);

/** https URL only (maps links, external references). */
export const httpsUrl = z.url({ protocol: /^https$/ });

/*
 * Rich text as structured blocks, never HTML. Paragraphs of text runs with
 * optional emphasis; designs render these with their own typography.
 */
const textRun = z.strictObject({
  text: z.string().max(2000),
  marks: z.array(z.enum(["em", "strong"])).max(2).optional(),
});

const paragraph = z.strictObject({
  type: z.literal("paragraph"),
  children: z.array(textRun).min(1).max(40),
});

export const richText = z.array(paragraph).min(1).max(30);
export type RichText = z.infer<typeof richText>;
