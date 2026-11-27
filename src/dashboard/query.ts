/*
 * The dashboard's URL state: filter, search, page and the open guest live in
 * the query string, so the server renders exactly what the URL says, links
 * can be shared between partners, and back/forward work. Pure.
 */

export const STATUS_FILTERS = ["all", "attending", "declined"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const PAGE_SIZE = 25;
export const SEARCH_MAX = 100;

export type DashboardQuery = {
  status: StatusFilter;
  /** Trimmed guest-name search; "" for none. */
  q: string;
  /** 1-based. */
  page: number;
  /** The reply open in the details panel. */
  guest?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseDashboardQuery(params: SearchParams): DashboardQuery {
  const status = first(params.status);
  const page = Number.parseInt(first(params.page), 10);
  const guest = first(params.guest);
  return {
    status: (STATUS_FILTERS as readonly string[]).includes(status) ? (status as StatusFilter) : "all",
    q: first(params.q).trim().slice(0, SEARCH_MAX),
    page: Number.isFinite(page) && page >= 1 && page <= 10_000 ? page : 1,
    guest: UUID.test(guest) ? guest.toLowerCase() : undefined,
  };
}

/** The query string for a state, leaving out defaults (so the plain URL is the default view). */
export function queryString(query: Partial<DashboardQuery>): string {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.guest) params.set("guest", query.guest);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const dashboardHref = (slug: string, query: Partial<DashboardQuery> = {}) => `/dashboard/${slug}${queryString(query)}`;

/** A case-insensitive substring pattern for `ilike`, with LIKE's own wildcards escaped. */
export const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
