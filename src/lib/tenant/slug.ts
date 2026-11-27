import { isReservedSlug } from "./reserved";

/**
 * An invitation slug is a single DNS label: 3–63 chars of a-z, 0-9 and
 * hyphens, starting and ending with a letter or digit.
 *
 * The same rule is enforced by the `invitations_slug_format` CHECK constraint
 * in the database. Keep the two identical.
 */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

/** Postgres-compatible spelling of {@link SLUG_PATTERN} (used in tests to compare with the migration). */
export const SLUG_PATTERN_SQL = "^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$";

export function isWellFormedSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !value.includes("--");
}

/** Well-formed and not reserved: the only slugs that may reach the database. */
export function isUsableSlug(value: string): boolean {
  return isWellFormedSlug(value) && !isReservedSlug(value);
}
