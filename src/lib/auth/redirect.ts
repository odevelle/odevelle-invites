/** Where to land after signing in: only the dashboard, never an outside or arbitrary URL. */
export function safeDashboardPath(next: string | null | undefined): string {
  if (!next || !/^\/dashboard(?:\/[a-z0-9-]*)?$/.test(next)) return "/dashboard";
  return next;
}
