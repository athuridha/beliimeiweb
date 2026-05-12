import { NextRequest, NextResponse } from "next/server";

// Routes that should never be blocked by maintenance
const BYPASS_PREFIXES = ["/admin", "/api", "/_next", "/favicon.ico", "/logo.png"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never block admin, API, or static asset routes
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // If user is already on /maintenance, don't redirect again (avoid loop)
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  try {
    // Build absolute URL for the internal API
    const statusUrl = new URL("/api/maintenance-status", request.url);
    const res = await fetch(statusUrl.toString(), {
      cache: "no-store",
      headers: { "x-middleware-check": "1" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.maintenance === true) {
        const maintenanceUrl = new URL("/maintenance", request.url);
        return NextResponse.redirect(maintenanceUrl);
      }
    }
  } catch {
    // If Redis/API is down, don't block the site
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
