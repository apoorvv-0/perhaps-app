/**
 * POST /api/auth/google/verify
 *
 * Step 1 of auth flow.
 * Receives a Google ID Token from the client (after Google Sign-In).
 * Validates it, looks up or creates the user record, then:
 * - If phone is already linked → issues a full session cookie.
 * - If phone is NOT yet linked → issues a temporary "pending" session cookie
 *   and instructs the client to collect a phone number.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";

// ─────────────────────────────────────────────
// Google Token Verification
// ─────────────────────────────────────────────

interface GoogleTokenPayload {
  sub: string;        // Google user ID
  email: string;
  name?: string;
  picture?: string;
  aud: string;
  exp: number;
}

async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    if (!res.ok) return null;

    const payload = (await res.json()) as GoogleTokenPayload;

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      console.warn("[GoogleAuth] Token audience mismatch");
      return null;
    }

    if (payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

const bodySchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    user = await prisma.user.create({
      data: {
        googleId,
        phoneNumber: `pending:${googleId}`,
        globalRole: "USER",
        status: "ACTIVE",
      },
    });
  }

  if (user.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "Your account has been suspended. Contact support." },
      { status: 403 }
    );
  }

  // ── Check if phone is already linked ─────────────────────────
  const phoneLinked = !user.phoneNumber.startsWith("pending:");
  const profileComplete = !!(await prisma.profile.findUnique({
    where: { userId: user.id },
  }));

  await setSessionCookie({
    userId: user.id,
    globalRole: user.globalRole,
    phoneVerified: phoneLinked,
    profileComplete,
    pendingPhoneLink: !phoneLinked,
    googleId,
  });

  return NextResponse.json({
    userId: user.id,
    phoneVerified: phoneLinked,
    profileComplete,
    requiresPhoneLink: !phoneLinked,
  });
}
