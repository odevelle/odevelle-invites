import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getInvitationSource } from "./source";

/**
 * The published record for a slug, cached per invitation.
 *
 * Tenant isolation: the cache key is this function plus its `slug` argument,
 * and nothing request-specific (no headers, no cookies) is read inside, so
 * one invitation's entry can never be served for another slug.
 *
 * Tags let a publish or edit invalidate exactly one invitation:
 *   `invitation-slug:{slug}` (works before the id is known, e.g. a 404 later published)
 *   `invitation:{id}`
 *
 * Only the raw JSON is cached (cache values must be serialisable); it's
 * validated on every render, which is cheap.
 */
export async function getPublishedInvitationRecord(slug: string): Promise<unknown> {
  "use cache";
  cacheLife("days");
  cacheTag(`invitation-slug:${slug}`);

  const record = await getInvitationSource().getPublishedRecord(slug);
  if (record && typeof record === "object" && "id" in record && typeof record.id === "string") {
    cacheTag(`invitation:${record.id}`);
  }
  return record ?? null;
}
