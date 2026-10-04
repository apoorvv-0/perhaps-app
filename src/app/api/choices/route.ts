/**
 * GET  /api/choices      - Get current user's ranked choices
 * PUT  /api/choices      - Atomic replace-all of ranked choices (Decision #1, #2)
 *
 * Save is an atomic delete-and-reinsert inside a single transaction.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

const choicesSchema = z
  .array(z.string().uuid("Each pick must be a valid user ID"))
  .max(12, "You can pick at most 12 people.");

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
          firstName: true, lastName: true, college: true, batch: true
        },
      },
    },
  });

  return NextResponse.json({ choices });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.phoneVerified || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event || event.status !== "CHOOSING_OPEN") {
    return NextResponse.json({ error: "Choosing is not currently open." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bodyObj = body as { picks?: unknown; choices?: unknown };
  const rawList = bodyObj.choices ?? bodyObj.picks;
  const parsed = choicesSchema.safeParse(rawList);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid picks" }, { status: 400 });
  }

  const pickedIds = parsed.data;

  if (new Set(pickedIds).size !== pickedIds.length) {
    return NextResponse.json({ error: "Duplicate picks are not allowed." }, { status: 400 });
  }

  if (pickedIds.includes(session.userId)) {
    return NextResponse.json({ error: "You cannot pick yourself." }, { status: 400 });
  }

  // --- Admin Exemption Check ---
  const myRegistration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } }
  });

  if (!myRegistration) {
    return NextResponse.json({ error: "You are not registered for this event." }, { status: 403 });
  }

  if (!myRegistration.minChoiceExempt && pickedIds.length > 0 && pickedIds.length < 3) {
    return NextResponse.json({ error: "You must pick at least 3 people (or clear all)." }, { status: 400 });
  }

  // Verify all picks
  const me = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  const oppositeGender = me.gender === "MALE" ? "FEMALE" : "MALE";

  const pickedUsers = await prisma.user.findMany({
    where: { id: { in: pickedIds } },
    include: { eventRegistrations: { where: { eventId: event.id } } },
  });

  for (const id of pickedIds) {
    const user = pickedUsers.find((u) => u.id === id);
    if (!user) return NextResponse.json({ error: `User ${id} not found.` }, { status: 400 });
    if (user.status !== "ACTIVE") return NextResponse.json({ error: `User ${id} is not active.` }, { status: 400 });
    if (user.gender !== oppositeGender) return NextResponse.json({ error: `Same-gender picks are not allowed.` }, { status: 400 });
    if (user.eventRegistrations.length === 0) return NextResponse.json({ error: `User ${id} is not registered for this event.` }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.choice.deleteMany({
      where: { eventId: event.id, pickerId: session.userId },
    }),
    prisma.choice.createMany({
      data: pickedIds.map((pickedId, index) => ({
        eventId: event.id,
        pickerId: session.userId,
        pickedId,
        rank: index + 1,
      })),
    }),
  ]);

  return NextResponse.json({
    ok: true,
    savedCount: pickedIds.length,
    message: `${pickedIds.length} picks saved successfully.`,
  });
}

export const dynamic = "force-dynamic";
