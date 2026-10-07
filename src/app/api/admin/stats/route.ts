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
  if (!event) {
    return NextResponse.json({
      eventName: "No Active Event",
      eventPhase: "N/A",
      registrationCount: 0,
      choicesCount: 0,
      matchCount: 0
    });
  }

  const [totalUsers, totalChoices, totalCoupons, revenueAggr] = await Promise.all([
    prisma.user.count(),
    prisma.choice.count({ where: { eventId: event.id } }),
    prisma.coupon.count({ where: { status: { not: "VOIDED" } } }),
    prisma.coupon.aggregate({ 
      where: { status: { not: "VOIDED" } },
      _sum: { faceValue: true } 
    })
  ]);

  const totalRevenueRupees = (revenueAggr._sum.faceValue || 0) / 100;

  return NextResponse.json({
    eventName: event.name,
    eventPhase: event.status,
    totalUsers,
    totalChoices,
    totalCoupons,
    totalRevenueRupees
  });
}
