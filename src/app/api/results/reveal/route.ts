/**
 * POST /api/results/reveal  - Reveal match contact details (Now Free!)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (session?.idVerificationStatus !== "APPROVED" || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event || (event.status !== "RESULTS_OPEN" && event.status !== "CLOSED")) {
    return NextResponse.json(
      { error: "Results are not currently open." },
      { status: 403 }
    );
  }

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

  // Always mark as revealed for free
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
