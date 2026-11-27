import { NextResponse, type NextRequest } from "next/server";
import { DEV_ROOT_DOMAINS, getRootDomain } from "@/lib/tenant/config";
import { routeRequest } from "@/lib/tenant/routing";
import { ACCOUNT_PATH } from "@/lib/supabase/config";
import { withRefreshedSession } from "@/lib/supabase/proxy";

/*
 * Multi-tenant routing: {slug}.odevelle.com → /sites/{slug}. The rules live in
 * src/lib/tenant/routing.ts (pure, unit-tested). No I/O here: whether the
 * invitation exists is decided by the page, against the cached database read.
 *
 * The one exception: the couple's account pages (/login, /auth, /dashboard on
 * the root domain) refresh their sign-in cookie here (lib/supabase/proxy.ts).
 * On an invitation subdomain those paths are 404s like any other.
 */

export function proxy(request: NextRequest): NextResponse | Promise<NextResponse> {
  const decision = routeRequest(
    {
      host: request.headers.get("host"),
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      protocol: request.nextUrl.protocol,
    },
    { rootDomain: getRootDomain(), devRootDomains: DEV_ROOT_DOMAINS },
  );

  switch (decision.action) {
    case "continue":
      return ACCOUNT_PATH.test(request.nextUrl.pathname) ? withRefreshedSession(request) : NextResponse.next();
    case "redirect":
      return NextResponse.redirect(decision.location, 308);
    case "not-found":
      return notFound();
    case "rewrite": {
      const url = request.nextUrl.clone();
      url.pathname = decision.pathname;
      const response = NextResponse.rewrite(url);
      // Invitations are unlisted. The page says so too; the header also covers non-HTML responses.
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
  }
}

export const config = {
  // Everything except Next's own files, dev endpoints and anything with a file extension
  // (public/ artwork, fixture media, icons), which load the same on every host.
  matcher: ["/((?!_next/|__nextjs|.*\\.[A-Za-z0-9]+$).*)"],
};

/** A real 404 (status and page) without rendering: invalid hosts and paths never reach the app. */
function notFound() {
  return new NextResponse(NOT_FOUND_HTML, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

const NOT_FOUND_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Invitation not found · ODEVELLE</title>
<style>
  html,body{margin:0;height:100%}
  body{display:grid;place-items:center;padding:0 24px;background:#f7f5ef;color:#1f2420;text-align:center;
       font-family:Georgia,"Times New Roman",serif;-webkit-font-smoothing:antialiased}
  main{max-width:28rem}
  .brand{font:500 .8rem/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.2em;color:#4a5e3f;margin:0}
  h1{font-size:2.25rem;font-weight:400;line-height:1.15;margin:1rem 0 0}
  p.body{font:1rem/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:#4f554e;margin:1rem 0 0}
</style>
</head>
<body>
<main data-invitation-state="not-found">
  <p class="brand">ODEVELLE</p>
  <h1>We couldn’t find this invitation</h1>
  <p class="body">Please check the link you were sent. If it still doesn’t open, ask the couple or host to share it again.</p>
</main>
</body>
</html>`;
