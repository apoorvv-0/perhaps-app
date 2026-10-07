import { NextRequest, NextResponse } from "next/server";
import { getActiveEvent } from "@/lib/event-service";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ status: "NONE", isRegistered: false });
  }

  let isRegistered = false;
  const session = await getSession();
  if (session?.userId) {
    const reg = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.userId } }
    });
    isRegistered = !!reg;
  }

  return NextResponse.json({
    status: event.status,
    registrationEndAt: event.registrationEndAt,
    isRegistered
  });
}

export const dynamic = "force-dynamic";
