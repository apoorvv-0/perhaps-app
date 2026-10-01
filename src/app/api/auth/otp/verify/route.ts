/**
 * POST /api/auth/otp/verify
 *
 * Step 2b of auth flow.
 * Verifies the OTP, links the phone number to the user's account,
 * then upgrades the session cookie to fully verified.
 * Enforces: one Google account ↔ one phone number (both ways).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { verifyOtp, normalizeIndiaPhone } from "@/lib/auth/otp";
import { z } from "zod";

const bodySchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!session.pendingPhoneLink && session.phoneVerified) {
    // Already verified — nothing to do
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { phone, otp } = parsed.data;
  const normalizedPhone = normalizeIndiaPhone(phone)!; // already validated by regex

  // ── Verify OTP ───────────────────────────
  const result = await verifyOtp(phone, otp);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, locked: result.locked },
      { status: result.locked ? 429 : 400 }
    );
  }

  // ── Double-check phone not already taken ─
  const existing = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
  });
  if (existing && existing.id !== session.userId) {
    return NextResponse.json(
      { error: "This phone number is already linked to another account." },
      { status: 409 }
    );
  }

  // ── Link phone to account ────────────────
  await prisma.user.update({
    where: { id: session.userId },
    data: { phoneNumber: normalizedPhone },
  });

  // ── Check profile completeness ───────────
  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  // ── Upgrade session to fully verified ────
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  await setSessionCookie({
    userId: user.id,
    globalRole: user.globalRole,
    phoneVerified: true,
    profileComplete: !!profile,
    pendingPhoneLink: false,
  });

  return NextResponse.json({
    ok: true,
    phoneVerified: true,
    profileComplete: !!profile,
  });
}
