import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event-service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getActiveEvent();
  if (!event || event.status !== "REGISTRATION_OPEN") {
    return NextResponse.json({ error: "Registration is not open." }, { status: 400 });
  }

  if (event.registrationEndAt && new Date() > new Date(event.registrationEndAt)) {
    return NextResponse.json({ error: "Registration timer has expired." }, { status: 400 });
  }

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    create: { eventId: event.id, userId: session.userId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
