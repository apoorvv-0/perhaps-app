import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event-service";

// GET /api/admin/users
export async function GET() {
  const session = await getSession();
  if (!session || session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ users: [] });

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: event.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          college: true,
          batch: true,
          gender: true,
          instagramHandle: true,
          globalRole: true,
          status: true,
          eventRoles: {
            where: { eventId: event.id }
          }
        }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Flatten for frontend
  const users = registrations.map(r => ({
    ...r.user,
    minChoiceExempt: r.minChoiceExempt,
    eventRoles: r.user.eventRoles.map(er => er.role)
  }));

  return NextResponse.json({ users });
}

// PATCH /api/admin/users
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can modify users." }, { status: 403 });
  }

  const body = await req.json();
  const { userId, status, minChoiceExempt, toggleEventRole } = body;

  if (userId === session.userId) {
    return NextResponse.json({ error: "You cannot change your own status." }, { status: 403 });
  }

  // Update global status
  if (status !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  // Update event-specific exemption
  const event = await getActiveEvent();
  if (minChoiceExempt !== undefined && event) {
    await prisma.eventRegistration.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { minChoiceExempt },
    });
  }

  // Toggle Event Role (e.g. CASHIER or ADMIN)
  if (toggleEventRole && event) {
    const existingRole = await prisma.eventRole.findUnique({
      where: { eventId_userId_role: { eventId: event.id, userId, role: toggleEventRole } }
    });

    if (existingRole) {
      await prisma.eventRole.delete({ where: { id: existingRole.id } });
    } else {
      await prisma.eventRole.create({
        data: { eventId: event.id, userId, role: toggleEventRole }
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
