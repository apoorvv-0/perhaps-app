/**
 * Next.js Middleware
 *
 * Runs on the Edge Runtime (no DB access — JWT only).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/session-core";

async function getSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  // ── Roviara Hub (SUPER_ADMIN only) ───────────────────────────
  if (pathname.startsWith("/roviara") && !pathname.startsWith("/roviara/login")) {
    if (!session || session.globalRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── SUPER_ADMIN routes ───────────────────────────────────────
  if (pathname.startsWith("/superadmin")) {
    if (!session || session.globalRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── Event Staff routes (Admin/Cashier) ───────────────────────
  // Middleware only checks for valid session. The actual routes/pages
  // hit the DB to verify EventRole or SUPER_ADMIN.
  if (pathname.startsWith("/admin") || pathname.startsWith("/cashier")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── Fully protected routes ───────────────────────────────────
  const PROTECTED_ROUTES = ["/dashboard", "/directory", "/choices", "/results", "/profile", "/leaderboard"];
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (session.idVerificationStatus !== "APPROVED") {
      return NextResponse.redirect(new URL("/verify-id", request.url));
    }
    if (!session.profileComplete && !pathname.startsWith("/profile")) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    return NextResponse.next();
  }

  // ── Semi-protected ───────────────────────────────────────────
  const SEMI_PROTECTED = ["/verify-id"];
  if (SEMI_PROTECTED.some((r) => pathname.startsWith(r))) {
    if (!session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/directory/:path*",
    "/choices/:path*",
    "/results/:path*",
    "/profile/:path*",
    "/leaderboard/:path*",
    "/verify-id/:path*",
    "/admin/:path*",
    "/cashier/:path*",
    "/superadmin/:path*",
    "/roviara/:path*",
    "/api/:path*",
  ],
};
