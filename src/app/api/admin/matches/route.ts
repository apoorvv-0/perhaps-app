import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";

export async function GET() {
  const session = await getSession();
  if (!session || (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("ADMIN"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ matches: [] });

  const matches = await prisma.match.findMany({
    where: { eventId: event.id },
    include: {
      user1: { select: { firstName: true, lastName: true, gender: true, college: true, batch: true, instagramHandle: true, id: true } },
      user2: { select: { firstName: true, lastName: true, gender: true, college: true, batch: true, instagramHandle: true, id: true } },
    },
    orderBy: { matchStrength: 'desc' }
  });

  return NextResponse.json({ matches });
}
export const dynamic = "force-dynamic";
