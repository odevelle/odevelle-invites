"use server";

import { headers } from "next/headers";
import { submitRsvp } from "./submit";
import type { RsvpFormState } from "./types";

/**
 * The RSVP form's Server Action. Bound to the invitation's slug by the form;
 * the slug is only a lookup key, verified against the database in submitRsvp.
 * Next.js rejects cross-origin calls (Origin must match Host).
 */
export async function submitRsvpAction(slug: string, _previous: RsvpFormState, formData: FormData): Promise<RsvpFormState> {
  const h = await headers();
  // On Vercel both headers carry the client's address, set by the platform.
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return submitRsvp(typeof slug === "string" ? slug : "", formData, { ip });
}
