/**
 * POST /api/results/reveal  — Redeem a coupon to reveal match contact details
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { redeemCoupon } from "@/lib/coupon-service";
import { z } from "zod";

const bodySchema = z.object({
  couponCode: z.string().min(1).max(20).toUpperCase(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.phoneVerified || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event || (event.status !== "RESULTS_OPEN" && event.status !== "CLOSED")) {
    return NextResponse.json(
      { error: "Results are not currently open." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
  }

  const { couponCode } = parsed.data;
  const userId = session.userId;

  // Find match
  const match = await prisma.match.findFirst({
    where: {
      eventId: event.id,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });

  if (!match) {
    return NextResponse.json(
      { error: "You don't have a match for this event." },
      { status: 404 }
    );
  }

  const isUser1 = match.user1Id === userId;
  const alreadyRevealed = isUser1 ? match.revealed1 : match.revealed2;

  if (alreadyRevealed) {
    return NextResponse.json(
      { error: "You have already revealed your match." },
      { status: 409 }
    );
  }

  // Redeem the coupon
  const redeemResult = await redeemCoupon({
    code: couponCode,
    redeemedByUserId: userId,
    requiredPaise: 99 * 100, // Fixed price
  });

  if (!redeemResult.ok) {
    return NextResponse.json({ error: redeemResult.error }, { status: 400 });
  }

  // Mark as revealed
  await prisma.match.update({
    where: { id: match.id },
    data: isUser1 ? { revealed1: true } : { revealed2: true },
  });

  const matchedUserId = isUser1 ? match.user2Id : match.user1Id;
  const matchedProfile = await prisma.user.findUnique({
    where: { id: matchedUserId },
    select: {
      firstName: true,
      lastName: true,
      instagramHandle: true,
      college: true,
      batch: true,
    },
  });

  return NextResponse.json({
    ok: true,
    matchedUser: matchedProfile,
  });
}
