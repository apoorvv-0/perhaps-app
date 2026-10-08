/**
 * GET /api/results  — Get current user's match result
 *
 * Available only in RESULTS_OPEN phase.
 * Returns match/no-match status.
 * Full contact details (instagramHandle) only shown after coupon redemption (reveal).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";

export async function GET() {
  const session = await getSession();
  if (!session?.idVerificationStatus === "APPROVED" || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event || (event.status !== "RESULTS_OPEN" && event.status !== "CLOSED")) {
    return NextResponse.json(
      { error: "Results are not yet available." },
      { status: 403 }
    );
  }

  const userId = session.userId;

  // Find match (user could be user1 or user2)
  const match = await prisma.match.findFirst({
    where: {
      eventId: event.id,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });

  if (!match) {
    return NextResponse.json({ matched: false });
  }

  const matchedUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
  const isRevealed = match.user1Id === userId ? match.revealed1 : match.revealed2;

  // Always return match status
  const response: Record<string, unknown> = {
    matched: true,
    revealed: isRevealed,
    matchStrength: match.matchStrength,
  };

  if (isRevealed) {
    // Show full contact details only after reveal
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
    response.matchedUser = matchedProfile;
  } else {
    // Just enough to show "You have a match!" without leaking identity
    const matchedProfile = await prisma.user.findUnique({
      where: { id: matchedUserId },
      select: { college: true, batch: true },
    });
    response.hint = {
      college: matchedProfile?.college,
      batch: matchedProfile?.batch,
    };
  }

  return NextResponse.json(response);
}
