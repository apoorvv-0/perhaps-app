/**
 * GET  /api/profile       — Get current user's profile
 * PUT  /api/profile       — Create or update profile (frozen after REGISTRATION_CLOSED)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

// ── Validation ──────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  instagramHandle: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/, "Invalid Instagram handle — only letters, numbers, . and _ are allowed")
    .transform((v) => v.replace(/^@/, "")),
  gender: z.enum(["MALE", "FEMALE"]),
  college: z.string().min(1).max(100),
  batch: z.string().min(1).max(20),
  leaderboardOptIn: z.boolean().optional().default(true),
  // ageAttestation is optional — enforced by the form's checkbox UI, not the API
  ageAttestation: z.boolean().optional().default(true),
});

// ── GET ──────────────────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session?.phoneVerified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json({ profile: profile ?? null });
}

// ── PUT ──────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.phoneVerified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Check event phase ────────────────────────────────────
  const event = await getActiveEvent();
  if (event && !["DRAFT", "REGISTRATION_OPEN"].includes(event.status)) {
    return NextResponse.json(
      { error: "Registration is closed. Your profile is frozen. Contact an admin for corrections." },
      { status: 403 }
    );
  }

  // ── Parse & validate body ────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── Validate college/batch against event's allowed lists ──
  if (event) {
    let allowedColleges: string[] = [];
    let allowedBatches: string[] = [];
    try {
      allowedColleges = JSON.parse(event.colleges as string);
      allowedBatches = JSON.parse(event.batches as string);
    } catch {
      // If JSON parse fails, skip validation (no restrictions set)
    }
    if (allowedColleges.length > 0 && !allowedColleges.includes(data.college)) {
      return NextResponse.json({ error: `Invalid college selection.` }, { status: 400 });
    }
    if (allowedBatches.length > 0 && !allowedBatches.includes(data.batch)) {
      return NextResponse.json({ error: `Invalid batch selection.` }, { status: 400 });
    }
  }

  // ── Upsert profile ───────────────────────────────────────
  // Check if profile already exists and enforce immutability
  const existingProfile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  if (existingProfile) {
    if (data.gender !== existingProfile.gender) {
      return NextResponse.json({ error: "Gender cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
    if (data.college !== existingProfile.college) {
      return NextResponse.json({ error: "College cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      instagramHandle: data.instagramHandle,
      gender: data.gender,
      college: data.college,
      batch: data.batch,
      leaderboardOptIn: data.leaderboardOptIn,
      ageAttestation: data.ageAttestation,
    },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      instagramHandle: data.instagramHandle,
      batch: data.batch,
      leaderboardOptIn: data.leaderboardOptIn,
    },
  });

  // ── Register in the event if not already ─────────────────
  if (event) {
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId: session.userId } },
      create: { eventId: event.id, userId: session.userId },
      update: {},
    });
  }

  // ── Refresh session with profileComplete=true ─────────────
  await setSessionCookie({
    ...session,
    profileComplete: true,
  });

  return NextResponse.json({ ok: true, profile });
}
