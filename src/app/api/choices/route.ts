/**
 * GET  /api/choices      — Get current user's ranked choices
 * PUT  /api/choices      — Atomic replace-all of ranked choices (Decision #1, #2)
 *
 * Save is an atomic delete-and-reinsert inside a single transaction.
 * This avoids rank-collision issues and ensures the full list is always consistent.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const choicesSchema = z
  .array(z.string().uuid("Each pick must be a valid user ID"))
  .min(3, "You must pick at least 3 people.")
  .max(12, "You can pick at most 12 people.");

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session?.phoneVerified || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ choices: [] });
  }

  const choices = await prisma.choice.findMany({
    where: { eventId: event.id, pickerId: session.userId },
    orderBy: { rank: "asc" },
    select: {
      rank: true,
      pickedId: true,
      picked: {
        select: {
          profile: {
            select: { firstName: true, lastName: true, college: true, batch: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ choices });
}

// ─────────────────────────────────────────────
// PUT — Atomic replace-all
// ─────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.phoneVerified || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Phase gate ───────────────────────────
  const event = await getActiveEvent();
  if (!event || event.status !== "CHOOSING_OPEN") {
    return NextResponse.json(
      { error: "Choosing is not currently open." },
      { status: 403 }
    );
  }

  // ── Parse body ───────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept either { choices: [...] } (frontend) or { picks: [...] } (original API)
  const bodyObj = body as { picks?: unknown; choices?: unknown };
  const rawList = bodyObj.choices ?? bodyObj.picks;
  const parsed = choicesSchema.safeParse(rawList);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid picks" },
      { status: 400 }
    );
  }

  const pickedIds = parsed.data;

  // ── No duplicates ────────────────────────
  if (new Set(pickedIds).size !== pickedIds.length) {
    return NextResponse.json(
      { error: "Duplicate picks are not allowed." },
      { status: 400 }
    );
  }

  // ── Cannot pick yourself ─────────────────
  if (pickedIds.includes(session.userId)) {
    return NextResponse.json(
      { error: "You cannot pick yourself." },
      { status: 400 }
    );
  }

  // ── Validate all picked users exist, are active, opposite gender, registered ─
  const myProfile = await prisma.profile.findUniqueOrThrow({
    where: { userId: session.userId },
  });
  const oppositeGender = myProfile.gender === "MALE" ? "FEMALE" : "MALE";

  const pickedProfiles = await prisma.profile.findMany({
    where: { userId: { in: pickedIds } },
    include: {
      user: {
        include: {
          eventRegistrations: { where: { eventId: event.id } },
        },
      },
    },
  });

  for (const id of pickedIds) {
    const profile = pickedProfiles.find((p) => p.userId === id);
    if (!profile) {
      return NextResponse.json(
        { error: `User ${id} not found.` },
        { status: 400 }
      );
    }
    if (profile.user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `User ${id} is not active.` },
        { status: 400 }
      );
    }
    // Cross-gender enforcement (Decision #13) — API-level rejection
    if (profile.gender !== oppositeGender) {
      return NextResponse.json(
        { error: `Same-gender picks are not allowed.` },
        { status: 400 }
      );
    }
    if (profile.user.eventRegistrations.length === 0) {
      return NextResponse.json(
        { error: `User ${id} is not registered for this event.` },
        { status: 400 }
      );
    }
  }

  // ── Atomic replace-all (Decision #1) ─────
  // Delete all existing choices, then reinsert in rank order — single transaction
  await prisma.$transaction([
    prisma.choice.deleteMany({
      where: { eventId: event.id, pickerId: session.userId },
    }),
    prisma.choice.createMany({
      data: pickedIds.map((pickedId, index) => ({
        eventId: event.id,
        pickerId: session.userId,
        pickedId,
        rank: index + 1, // 1-indexed
      })),
    }),
  ]);

  return NextResponse.json({
    ok: true,
    savedCount: pickedIds.length,
    message: `${pickedIds.length} picks saved successfully.`,
  });
}
