/**
 * GET  /api/directory    — Browse opposite-gender participants
 * 
 * Returns paginated list of opposite-gender active participants.
 * Includes duplicate-name warning flags (Decision #11).
 * Hidden fields: gender, instagramHandle (only visible post-match reveal).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { Gender, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.phoneVerified || !session.profileComplete) {
    return NextResponse.json({ eventPhase: event.status, error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event || event.status !== "CHOOSING_OPEN") {
    return NextResponse.json(
      { error: "Choosing is not currently open." },
      { status: 403 }
    );
  }

  // Get the current user's gender
  const myProfile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (!myProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const oppositeGender: Gender = myProfile.gender === "MALE" ? "FEMALE" : "MALE";

  // Parse query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const college = searchParams.get("college") ?? "";
  const batch = searchParams.get("batch") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  // Build where clause
  const where: Prisma.ProfileWhereInput = {
    gender: oppositeGender,
    user: {
      status: "ACTIVE",
      // Must be registered in this event
      eventRegistrations: {
        some: { eventId: event.id },
      },
    },
    ...(college ? { college } : {}),
    ...(batch ? { batch } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        }
      : {}),
  };

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        college: true,
        batch: true,
        // gender & instagramHandle intentionally excluded from directory
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      
    }),
    prisma.profile.count({ where }),
  ]);

  // ── Duplicate-name warning (Decision #11) ─
  // For each profile in results, flag if another participant shares the same full name
  const allNames = await prisma.profile.findMany({
    where: {
      gender: oppositeGender,
      user: {
        status: "ACTIVE",
        eventRegistrations: { some: { eventId: event.id } },
      },
    },
    select: { userId: true, firstName: true, lastName: true },
  });

  const nameCounts = new Map<string, number>();
  for (const p of allNames) {
    const key = `${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`;
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  const enriched = profiles.map((p) => ({
    ...p,
    hasDuplicateName:
      (nameCounts.get(
        `${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`
      ) ?? 0) > 1,
  }));

  return NextResponse.json({
    participants: enriched,
    pagination: {
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
