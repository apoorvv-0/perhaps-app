import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { Gender, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session?.idVerificationStatus !== "APPROVED" || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event) {
    return NextResponse.json({ error: "No active event.", eventPhase: null }, { status: 403 });
  }
  if (event.status !== "CHOOSING_OPEN" && event.status !== "CHOOSING_CLOSED") {
    return NextResponse.json({ error: "Choosing is not currently open.", eventPhase: event.status }, { status: 403 });
  }

  const myUser = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!myUser) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const oppositeGender: Gender = myUser.gender === "MALE" ? "FEMALE" : "MALE";
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const college = searchParams.get("college") ?? "";
  const batch = searchParams.get("batch") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const where: Prisma.UserWhereInput = {
    gender: oppositeGender,
    status: "ACTIVE",
    eventRegistrations: { some: { eventId: event.id } },
  };

  const [profiles, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, gender: true, college: true, batch: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.user.count({ where }),
  ]);

  const allNames = await prisma.user.findMany({
    where: { gender: oppositeGender, status: "ACTIVE", eventRegistrations: { some: { eventId: event.id } } },
    select: { id: true, firstName: true, lastName: true },
  });

  const collegeConfig = await prisma.appConfig.findUnique({ where: { key: 'colleges' } });
  const aliasMap = new Map<string, string>();
  if (collegeConfig && Array.isArray(collegeConfig.value)) {
    for (const c of collegeConfig.value) {
      if (c && typeof c === 'object' && (c as any).name && (c as any).alias) {
        aliasMap.set((c as any).name, (c as any).alias);
      }
    }
  }

  const nameCounts = new Map<string, number>();
  for (const p of allNames) {
    const key = `${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`;
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  const enriched = profiles.map((p) => ({
    id: p.id, gender: p.gender,
    firstName: p.firstName, lastName: p.lastName, college: aliasMap.get(p.college || "") || p.college, batch: p.batch,
    alias: (nameCounts.get(`${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`) ?? 0) > 1 ? (aliasMap.get(p.college || "") || p.college) : undefined,
  }));

  return NextResponse.json({
    participants: enriched,
    eventPhase: event.status,
    pagination: { total, page: 1, pageSize: total, totalPages: 1 },
  });
}

export const dynamic = "force-dynamic";

