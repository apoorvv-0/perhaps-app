import { prisma } from "@/lib/db/prisma";

export async function generateLeaderboard(eventId: string, adminId: string) {
  // Clear any existing entries for this event
  await prisma.leaderboardEntry.deleteMany({
    where: { eventId },
  });

  // Get all choices for the event
  const choices = await prisma.choice.findMany({
    where: { eventId },
    select: { pickedId: true },
  });

  // Count picks per user
  const pickCounts: Record<string, number> = {};
  for (const choice of choices) {
    pickCounts[choice.pickedId] = (pickCounts[choice.pickedId] || 0) + 1;
  }

  // Get profiles for all picked users who opted in
  const userIds = Object.keys(pickCounts);
  const profiles = await prisma.profile.findMany({
    where: {
      userId: { in: userIds },
      leaderboardOptIn: true,
      user: { status: "ACTIVE" },
    },
  });

  // Attach counts to profiles
  const rankedUsers = profiles.map(p => ({
    userId: p.userId,
    gender: p.gender,
    college: p.college,
    batch: p.batch,
    pickerCount: pickCounts[p.userId],
  }));

  // Helper to get Top N and insert
  const insertTopN = async (
    sliceName: string,
    filteredUsers: typeof rankedUsers,
    limit: number = 3
  ) => {
    // Sort descending by pickerCount
    filteredUsers.sort((a, b) => b.pickerCount - a.pickerCount);
    
    const top = filteredUsers.slice(0, limit);
    
    // We can have ties. A simple dense ranking or standard ranking.
    // Standard ranking: 1, 2, 3...
    const entries = top.map((u, i) => ({
      eventId,
      userId: u.userId,
      gender: u.gender,
      college: u.college,
      batch: u.batch,
      pickerCount: u.pickerCount,
      rank: i + 1,
      slice: sliceName,
    }));

    if (entries.length > 0) {
      await prisma.leaderboardEntry.createMany({ data: entries });
    }
  };

  // 1. Overall
  await insertTopN("overall", rankedUsers.filter(u => u.gender === "MALE"));
  await insertTopN("overall", rankedUsers.filter(u => u.gender === "FEMALE"));

  // 2. Per College
  const colleges = Array.from(new Set(rankedUsers.map(u => u.college)));
  for (const col of colleges) {
    await insertTopN(`college:${col}`, rankedUsers.filter(u => u.gender === "MALE" && u.college === col));
    await insertTopN(`college:${col}`, rankedUsers.filter(u => u.gender === "FEMALE" && u.college === col));
  }

  // 3. Per Batch
  const batches = Array.from(new Set(rankedUsers.map(u => u.batch)));
  for (const b of batches) {
    await insertTopN(`batch:${b}`, rankedUsers.filter(u => u.gender === "MALE" && u.batch === b));
    await insertTopN(`batch:${b}`, rankedUsers.filter(u => u.gender === "FEMALE" && u.batch === b));
  }

  // Log action
  await prisma.auditLog.create({
    data: {
      adminId,
      action: "GENERATE_LEADERBOARD",
      eventId,
      metadata: { totalRanked: rankedUsers.length },
    }
  });

  return { ok: true, generatedCount: rankedUsers.length };
}
