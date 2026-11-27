/*
 * The slice of the database the couple dashboard reads, typed for supabase-js.
 * Hand-written to match supabase/migrations (the dashboard only reads these);
 * `npx supabase gen types typescript --linked` can replace it wholesale later.
 * tests/db/dashboard.spec.ts checks RSVP_RESPONSE_COLUMNS against the real view.
 */

/** The rsvp_responses view's columns, in order. */
export const RSVP_RESPONSE_COLUMNS = [
  "id", "invitation_id", "guest_name", "attending", "party_size", "meal_preference", "message", "submitted_at", "same_name_count",
] as const;

export type RsvpResponseRow = {
  id: string;
  invitation_id: string;
  guest_name: string;
  attending: boolean;
  party_size: number;
  meal_preference: string | null;
  message: string | null;
  submitted_at: string;
  same_name_count: number;
};

type SameKeys<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Compile-time check: the row type and the column list name exactly the same columns. */
export const rsvpResponseColumnsMatch: SameKeys<(typeof RSVP_RESPONSE_COLUMNS)[number], keyof RsvpResponseRow> = true;

export type Database = {
  public: {
    Tables: {
      invitations: {
        Row: {
          id: string;
          slug: string;
          title: string;
          status: "draft" | "published" | "archived";
          primary_date: string | null;
          time_zone: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      rsvp_settings: {
        Row: {
          invitation_id: string;
          meal_options: string[];
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      rsvp_responses: {
        Row: RsvpResponseRow;
        Relationships: [];
      };
    };
    Functions: {
      rsvp_summary: {
        Args: { p_invitation_id: string };
        Returns: { total: number; attending: number; declined: number; guests: number }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
