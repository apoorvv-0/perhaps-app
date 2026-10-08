/**
 * GET  /api/choices      - Get current user's ranked choices
 * PUT  /api/choices      - Atomic replace-all of ranked choices
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session?.idVerificationStatus === "APPROVED" || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ choices: [], maxChoicesAllowed: 3 });
  }

  const choices = await prisma.choice.findMany({
    where: { eventId: event.id, pickerId: session.userId },
    orderBy: { rank: "asc" },
    select: {
      rank: true,
      pickedId: true,
      picked: {
        select: {
          firstName: true,
          lastName: true,
          gender: true,
          college: true,
          batch: true,
        },
      },
    },
  });

  const coupons = await prisma.coupon.findMany({
    where: { redeemedBy: session.userId, eventId: event.id, status: 'REDEEMED' }
  });
  const totalSpent = coupons.reduce((acc, c) => acc + c.faceValue, 0);
  let maxChoicesAllowed = 3;
  if (totalSpent >= 21600) maxChoicesAllowed = 15;
  else if (totalSpent >= 16700) maxChoicesAllowed = 12;
  else if (totalSpent >= 11800) maxChoicesAllowed = 9;
  else if (totalSpent >= 6900) maxChoicesAllowed = 6;

  return NextResponse.json({ choices, maxChoicesAllowed });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.idVerificationStatus === "APPROVED" || !session.profileComplete) {
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

  const coupons = await prisma.coupon.findMany({
    where: { redeemedBy: session.userId, eventId: event.id, status: 'REDEEMED' }
  });
  const totalSpent = coupons.reduce((acc, c) => acc + c.faceValue, 0);
  let maxAllowed = 3;
  if (totalSpent >= 21600) maxAllowed = 15;
  else if (totalSpent >= 16700) maxAllowed = 12;
  else if (totalSpent >= 11800) maxAllowed = 9;
  else if (totalSpent >= 6900) maxAllowed = 6;

  const dynSchema = z.array(z.string().uuid("Each pick must be a valid user ID")).max(maxAllowed, `You can only pick up to ${maxAllowed} people.`);
  const parsed = dynSchema.safeParse(rawList);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid picks" }, { status: 400 });
  }

  const pickedIds = parsed.data;

  const reg = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId: session.userId } } });
  const isExempt = reg?.minChoiceExempt ?? false;

  if (!isExempt && (pickedIds.length === 1 || pickedIds.length === 2)) {
    return NextResponse.json({ error: "You must select 0, or at least 3 people. 1 or 2 is not allowed." }, { status: 400 });
  }

  const uniqueIds = Array.from(new Set(pickedIds));
  if (uniqueIds.length !== pickedIds.length) {
    return NextResponse.json({ error: "Duplicate choices are not allowed." }, { status: 400 });
  }

  if (pickedIds.includes(session.userId)) {
    return NextResponse.json({ error: "You cannot pick yourself." }, { status: 400 });
  }

  const pickerUser = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!pickerUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  if (pickedIds.length > 0) {
    const validTargets = await prisma.user.findMany({
      where: {
        id: { in: pickedIds },
        status: "ACTIVE",
        gender: pickerUser.gender === "MALE" ? "FEMALE" : "MALE",
        eventRegistrations: { some: { eventId: event.id } }
      }
    });
    
    if (validTargets.length !== pickedIds.length) {
      return NextResponse.json({ error: "One or more selected users are invalid, inactive, or not participating." }, { status: 400 });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.choice.deleteMany({
        where: { eventId: event.id, pickerId: session.userId },
      });

      if (pickedIds.length > 0) {
        const createData = pickedIds.map((id, index) => ({
          eventId: event.id,
          pickerId: session.userId,
          pickedId: id,
          rank: index + 1,
        }));
        await tx.choice.createMany({ data: createData });
      }
    });

    return NextResponse.json({ ok: true, count: pickedIds.length });
  } catch (err: any) {
    if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: "Your choices were just updated. Please refresh the page." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
