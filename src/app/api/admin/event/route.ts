import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent, VALID_NEXT_PHASES } from "@/lib/event-service";
import { hasEventRole } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // BUG 3 FIX: SUPER_ADMIN can always access — they have no EventRole rows
  if (session.globalRole === "SUPER_ADMIN") {
    const event = await getActiveEvent();
    return NextResponse.json({ event: event ?? null });
  }

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ event: null });

  // For regular users, check event-specific role
  const isAuthorized = await hasEventRole(session.userId, event.id, "ADMIN");
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ event });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, nextPhase, eventName } = body;

  // ── Create a brand new event ──────────────────────────────
  if (action === "CREATE_NEW") {
    // Only SUPER_ADMIN can create entirely new events globally
    if (session.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only global admins can create events" }, { status: 403 });
    }

    const name = eventName?.trim() || `Perhaps Event`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

    const newEvent = await prisma.event.create({
      data: {
        name,
        slug,
        targetCollege: "Seth GS Medical College", // Default for now
        status: "DRAFT",
        colleges: "[]",
        batches: "[]",
      },
    });

    return NextResponse.json({ ok: true, event: newEvent });
  }

  // ── Advance / rollback phase ──────────────────────────────
  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ error: "No active event. Create one first." }, { status: 400 });
  }

  // BUG 3 FIX: SUPER_ADMIN can always advance phase
  if (session.globalRole !== "SUPER_ADMIN") {
    const isAuthorized = await hasEventRole(session.userId, event.id, "ADMIN");
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const validNext = VALID_NEXT_PHASES[event.status];
  if (!validNext.includes(nextPhase)) {
    return NextResponse.json(
      { error: `Cannot transition from ${event.status} to ${nextPhase}` },
      { status: 400 }
    );
  }

  const updatedEvent = await prisma.event.update({
    where: { id: event.id },
    data: { status: nextPhase },
  });

  return NextResponse.json({ ok: true, event: updatedEvent });
}
