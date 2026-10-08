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
      totalUsers: 0,
      totalChoices: 0,
      totalCoupons: 0,
      totalRevenueRupees: 0,
    });
  }

  const [
    totalUsers, 
    totalChoices, 
    totalCoupons, 
    revenueAggr,
    usersByGender,
    usersByCollege,
    eventRegistrations,
    idVerificationStats,
    matchesCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.choice.count({ where: { eventId: event.id } }),
    prisma.coupon.count({ where: { status: { not: "VOIDED" } } }),
    prisma.coupon.aggregate({ 
      where: { status: { not: "VOIDED" } },
      _sum: { faceValue: true } 
    }),
    prisma.user.groupBy({
      by: ['gender'],
      _count: { id: true }
    }),
    prisma.user.groupBy({
      by: ['college'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    }),
    prisma.eventRegistration.count({ where: { eventId: event.id } }),
    prisma.user.groupBy({
      by: ['idVerificationStatus'],
      _count: { id: true }
    }),
    prisma.match.count({ where: { eventId: event.id } })
  ]);

  const totalRevenueRupees = (revenueAggr._sum.faceValue || 0) / 100;

  // Format groupings
  const genderStats = usersByGender.reduce((acc, curr) => ({ ...acc, [curr.gender || 'UNKNOWN']: curr._count.id }), {} as Record<string, number>);
  const collegeStats = usersByCollege.map(c => ({ college: c.college || 'Unknown', count: c._count.id }));
  const verificationStats = idVerificationStats.reduce((acc, curr) => ({ ...acc, [curr.idVerificationStatus || 'UNVERIFIED']: curr._count.id }), {} as Record<string, number>);

  return NextResponse.json({
    eventName: event.name,
    eventPhase: event.status,
    totalUsers,
    totalChoices,
    totalCoupons,
    totalRevenueRupees,
    genderStats,
    collegeStats,
    eventRegistrations,
    verificationStats,
    matchesCount
  });
}
