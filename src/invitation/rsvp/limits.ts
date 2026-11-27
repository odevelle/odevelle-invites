/**
 * Guests per RSVP, including the person replying. One universal limit for
 * every invitation and package (no per-couple settings). The database holds
 * the same rule: the rsvps_guest_count constraint and submit_rsvp().
 */
export const RSVP_MAX_GUESTS = 50;
