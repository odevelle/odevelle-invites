import { z } from "zod";

/*
 * Enumerations shared with Postgres. Each list mirrors a `create type … as enum`
 * in supabase/migrations; a unit test fails if they drift apart.
 */

export const INVITATION_STATUSES = ["draft", "published", "archived"] as const;
export const invitationStatus = z.enum(INVITATION_STATUSES);
export type InvitationStatus = z.infer<typeof invitationStatus>;

export const PACKAGE_TIERS = ["classic", "signature", "exclusive"] as const;
export const packageTier = z.enum(PACKAGE_TIERS);
export type PackageTier = z.infer<typeof packageTier>;

export const OCCASIONS = [
  "wedding",
  "engagement",
  "birthday",
  "anniversary",
  "baptism",
  "confirmation",
  "other",
] as const;
export const occasion = z.enum(OCCASIONS);
export type Occasion = z.infer<typeof occasion>;

/**
 * How guests reach an invitation. V1 serves `unlisted` only (anyone with the
 * link, noindex). `passcode` is reserved for optional protected invitations:
 * the column and constraint exist now so adding it later needs no restructuring.
 */
export const ACCESS_MODES = ["unlisted", "passcode"] as const;
export const accessMode = z.enum(ACCESS_MODES);
export type AccessMode = z.infer<typeof accessMode>;

export const USER_ROLES = ["admin", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];
