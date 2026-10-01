/**
 * POST /api/auth/otp/send
 *
 * Step 2a of auth flow.
 * Requires a valid "pendingPhoneLink" session.
 * Sends an OTP to the provided Indian mobile number.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sendOtp } from "@/lib/auth/otp";
import { z } from "zod";

const bodySchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Must be in pending phone link state OR already verified (resend)
  if (!session.pendingPhoneLink && !session.phoneVerified) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      { error: parsed.error.issues[0]?.message ?? "Invalid phone number" },
      { status: 400 }
    );
  }

  const { phone } = parsed.data;

  // Check if phone is already registered to a DIFFERENT account
  const { prisma } = await import("@/lib/db/prisma");
  const existing = await prisma.user.findUnique({ where: { phoneNumber: `91${phone}` } });
  if (existing && existing.id !== session.userId) {
    return NextResponse.json(
      { error: "This phone number is already linked to another account." },
      { status: 409 }
    );
  }

  const result = await sendOtp(phone, session.userId);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({
    ok: true,
    expiresAt: result.expiresAt,
    message: `OTP sent to +91-XXXXXX${phone.slice(-4)}`,
  });
}
