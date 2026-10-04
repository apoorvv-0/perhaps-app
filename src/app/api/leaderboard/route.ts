import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ entries: [] });

  // Only expose leaderboard if Choosing is closed or beyond
  if (event.status === "DRAFT" || event.status === "REGISTRATION_OPEN" || event.status === "REGISTRATION_CLOSED" || event.status === "CHOOSING_OPEN") {
    return NextResponse.json({ entries: [] });
  }

  const entries = await prisma.leaderboardEntry.findMany({
    where: { eventId: event.id, rank: { lte: 3 } },
    include: {
      user: {
        select: { firstName: true, lastName: true, instagramHandle: true }
      }
    }
  });

  return NextResponse.json({ entries: entries.map(e => ({
    ...e,
    user: {
      profile: {
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        instagramHandle: e.user.instagramHandle
      }
    }
  })) });
}
