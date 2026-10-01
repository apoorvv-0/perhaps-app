import { NextRequest, NextResponse } from "next/server";
import { getSession, hasEventRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event-service";

// GET /api/admin/users  — list all registered users for the active event
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // BUG 3 FIX: SUPER_ADMIN bypasses EventRole check
  if (session.globalRole !== "SUPER_ADMIN") {
    const event = await getActiveEvent();
    if (!event) return NextResponse.json({ users: [] });

    const isAuthorized = await hasEventRole(session.userId, event.id, "ADMIN");
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ users: [] });

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: event.id },
    include: {
      user: {
        include: {
          profile: {
            select: { firstName: true, lastName: true, college: true, batch: true, gender: true, instagramHandle: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Flatten for the frontend
  const users = registrations.map(r => r.user);

  return NextResponse.json({ users });
}

// PATCH /api/admin/users  — suspend/activate a user (global action currently, restricted to SUPER_ADMIN)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can globally suspend users." }, { status: 403 });
  }

  const body = await req.json();
  const { userId, status } = body;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (userId === session.userId) {
    return NextResponse.json({ error: "You cannot change your own status." }, { status: 403 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  return NextResponse.json({ ok: true, user: updatedUser });
}
