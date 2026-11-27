import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthConfig } from "./config";

/**
 * Refreshes the couple's session cookie on account pages (dashboard, login,
 * auth), before any Server Component reads it. Without a sign-in cookie it
 * makes no network call. Invitation and marketing pages never come here, so
 * they stay static and never see the cookie.
 */
export async function withRefreshedSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const config = supabaseAuthConfig();

  if (config) {
    const supabase = createServerClient(config.url, config.publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          // Responses that set session cookies must never be cached by a CDN.
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    });
    // Validates the token (and refreshes it when it has expired) before the page renders.
    await supabase.auth.getClaims();
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
