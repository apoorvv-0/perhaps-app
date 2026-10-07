import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event-service";

// GET /api/admin/users
export async function GET() {
  const session = await getSession();
  if (!session || (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("ADMIN"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ users: [] });

  const dbUsers = await prisma.user.findMany({
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
      eventRegistrations: {
        where: { eventId: event.id }
      },
      eventRoles: {
        where: { eventId: event.id }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const users = dbUsers.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    college: u.college,
    batch: u.batch,
    gender: u.gender,
    instagramHandle: u.instagramHandle,
    globalRole: u.globalRole,
    status: u.status,
    minChoiceExempt: u.eventRegistrations.length > 0 ? u.eventRegistrations[0].minChoiceExempt : false,
    isRegistered: u.eventRegistrations.length > 0,
    eventRoles: u.eventRoles.map(er => er.role)
  }));

  return NextResponse.json({ users });
}

// PATCH /api/admin/users
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("ADMIN"))) {
    return NextResponse.json({ error: "Only admins can modify users." }, { status: 403 });
  }

  const body = await req.json();
  const { userId, status, minChoiceExempt, toggleEventRole, profile } = body;

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { globalRole: true } });
  if (targetUser?.globalRole === "SUPER_ADMIN" && session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admins can modify another Super Admin." }, { status: 403 });
  }

  if (userId === session.userId) {
    return NextResponse.json({ error: "You cannot change your own status." }, { status: 403 });
  }

  // Update global status
  if (profile) { await prisma.user.update({ where: { id: userId }, data: { firstName: profile.firstName, lastName: profile.lastName, college: profile.college, batch: profile.batch, gender: profile.gender, instagramHandle: profile.instagramHandle } }); } if (status !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  // Update event-specific exemption
  const event = await getActiveEvent();
  if (minChoiceExempt !== undefined && event) {
    // Upsert since the user might not be registered yet
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId } },
      create: { eventId: event.id, userId, minChoiceExempt },
      update: { minChoiceExempt },
    });
  }

  // Toggle Event Role (e.g. CASHIER or ADMIN)
  if (toggleEventRole && event) {
    if (toggleEventRole === 'ADMIN' && session.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can assign event admins.' }, { status: 403 });
    }
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
