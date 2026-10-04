import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const event = await getActiveEvent();
  let eventRoles: string[] = [];

  if (event) {
    const roles = await prisma.eventRole.findMany({
      where: { eventId: event.id, userId: session.userId },
      select: { role: true }
    });
    eventRoles = roles.map(r => r.role);
  }

  return NextResponse.json({ 
    session: {
      ...session,
      eventRoles
    }
  });
}
