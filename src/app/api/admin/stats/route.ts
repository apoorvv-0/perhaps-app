import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";

export async function GET() {
  const session = await getSession();
  
  if (!session || session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({
      eventName: "No Active Event",
      eventPhase: "N/A",
      registrationCount: 0,
      choicesCount: 0,
      matchCount: 0
    });
  }

  const [registrationCount, choicesCount, matchCount] = await Promise.all([
    prisma.eventRegistration.count({ where: { eventId: event.id } }),
    prisma.choice.count({ where: { eventId: event.id } }),
    prisma.match.count({ where: { eventId: event.id } })
  ]);

  return NextResponse.json({
    eventName: event.name,
    eventPhase: event.status,
    registrationCount,
    choicesCount,
    matchCount
  });
}
