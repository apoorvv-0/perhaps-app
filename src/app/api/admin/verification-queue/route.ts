import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("ADMIN"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingUsers = await prisma.user.findMany({
      where: { idVerificationStatus: "PENDING" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        college: true,
        batch: true,
        phone: true,
        idCardUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ queue: pendingUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("ADMIN"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, action } = await req.json();
    if (!["APPROVE", "REJECT", "SUSPEND"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "SUSPENDED";
    
    // If approved or rejected, we can clear the heavy image base64 from the DB to save space
    // If rejected/suspended, we probably want to delete the image too
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        idVerificationStatus: newStatus,
        idCardUrl: null // clear base64 from postgres to save space once reviewed
      }
    });

    
    if (newStatus === "APPROVED") {
      const event = await getActiveEvent();
      if (event && event.status === "REGISTRATION_OPEN") {
        await prisma.eventRegistration.upsert({
          where: { eventId_userId: { eventId: event.id, userId } },
          create: { eventId: event.id, userId },
          update: {}
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
