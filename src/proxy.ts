import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_EXACT = new Set(["/", "/login", "/forgot-password", "/reset-password"]);
const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/enquiry",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/logout",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const gate = await updateSession(request);

  // Always allow public marketing + auth entry points
  if (isPublicPath(pathname)) {
    // Logged-in users hitting /login go to CRM (unless password reset required)
    if (pathname === "/login" && gate.userId) {
      const dest = gate.mustResetPassword ? "/reset-password" : "/crm";
      const redirect = NextResponse.redirect(new URL(dest, request.url));
      return copyCookies(gate.response, redirect);
    }
    return gate.response;
  }

  if (!gate.userId) {
    if (pathname.startsWith("/api/")) {
      const unauthorized = NextResponse.json(
        { error: gate.inactive ? "Session expired after 7 days of inactivity." : "Unauthorized." },
        { status: 401 },
      );
      return copyCookies(gate.response, unauthorized);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    if (gate.inactive) loginUrl.searchParams.set("reason", "idle");
    const redirect = NextResponse.redirect(loginUrl);
    return copyCookies(gate.response, redirect);
  }

  if (gate.mustResetPassword && pathname !== "/reset-password") {
    const redirect = NextResponse.redirect(new URL("/reset-password", request.url));
    return copyCookies(gate.response, redirect);
  }

  if (!gate.mustResetPassword && pathname === "/reset-password") {
    // Allow reset-password when arriving from email recovery (query has type=recovery handled in page).
    // Otherwise send settled users to CRM.
    const type = request.nextUrl.searchParams.get("type");
    if (type !== "recovery") {
      const redirect = NextResponse.redirect(new URL("/crm", request.url));
      return copyCookies(gate.response, redirect);
    }
  }

  return gate.response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
