require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function runMatchingEngine(input) {
  const { participants, choices } = input;

  const participantMap = new Map(
    participants.map((p) => [p.userId, p])
  );

  const choiceMap = new Map();
  for (const c of choices) {
    if (!choiceMap.has(c.pickerId)) {
      choiceMap.set(c.pickerId, new Map());
    }
    choiceMap.get(c.pickerId).set(c.pickedId, c.rank);
  }

  const candidatePairs = [];
  const seenPairs = new Set();

  for (const [pickerId, picks] of choiceMap) {
    const pickerParticipant = participantMap.get(pickerId);
    if (!pickerParticipant || pickerParticipant.status !== "ACTIVE") continue;

    for (const [pickedId, rankAtoB] of picks) {
      const pairKey = [pickerId, pickedId].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const pickedParticipant = participantMap.get(pickedId);
      if (!pickedParticipant || pickedParticipant.status !== "ACTIVE") continue;

      if (pickerParticipant.gender === pickedParticipant.gender) continue;

      const rankBtoA = choiceMap.get(pickedId)?.get(pickerId);
      if (rankBtoA === undefined) continue;

      const signupA = pickerParticipant.signupTime;
      const signupB = pickedParticipant.signupTime;

      candidatePairs.push({
        userAId: pickerId,
        userBId: pickedId,
        rankAtoB,
        rankBtoA,
        strength: rankAtoB + rankBtoA,
        worseRank: Math.max(rankAtoB, rankBtoA),
        earlierSignup: signupA < signupB ? signupA : signupB,
        laterSignup: signupA > signupB ? signupA : signupB,
        canonicalLowerId: pickerId < pickedId ? pickerId : pickedId,
      });
    }
  }

  const totalMutualPairs = candidatePairs.length;

  candidatePairs.sort((a, b) => {
    if (a.strength !== b.strength) return a.strength - b.strength;
    if (a.worseRank !== b.worseRank) return a.worseRank - b.worseRank;
    const earlierDiff = a.earlierSignup.getTime() - b.earlierSignup.getTime();
    if (earlierDiff !== 0) return earlierDiff;
    const laterDiff = a.laterSignup.getTime() - b.laterSignup.getTime();
    if (laterDiff !== 0) return laterDiff;
    return a.canonicalLowerId < b.canonicalLowerId ? -1 : 1;
  });

  const matched = new Set();
  const matches = [];

  for (const pair of candidatePairs) {
    if (matched.has(pair.userAId) || matched.has(pair.userBId)) continue;

    matched.add(pair.userAId);
    matched.add(pair.userBId);

    const user1Id = pair.userAId < pair.userBId ? pair.userAId : pair.userBId;
    const user2Id = pair.userAId < pair.userBId ? pair.userBId : pair.userAId;

    matches.push({
      user1Id,
      user2Id,
      matchStrength: pair.strength,
      rankUser1ToUser2: user1Id === pair.userAId ? pair.rankAtoB : pair.rankBtoA,
      rankUser2ToUser1: user1Id === pair.userAId ? pair.rankBtoA : pair.rankAtoB,
    });
  }

  return {
    matches,
    matchedCount: matches.length,
    unmatchedMutualPairs: totalMutualPairs - matches.length,
    totalMutualPairs,
  };
}


async function main() {
  const event = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
  
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: event.id },
    include: { user: true },
  });

  const participants = registrations
    .filter((r) => r.user.status !== "DELETED")
    .map((r) => ({
      userId: r.userId,
      gender: r.user.gender,
      signupTime: r.user.createdAt,
      status: r.user.status,
    }));

  const choices = await prisma.choice.findMany({
    where: { eventId: event.id },
    select: { pickerId: true, pickedId: true, rank: true },
  });

  const frozenChoices = choices.map((c) => ({
    pickerId: c.pickerId,
    pickedId: c.pickedId,
    rank: c.rank,
  }));

  console.log("Calling actual engine...");
  const result = runMatchingEngine({ participants, choices: frozenChoices });
  console.log("Actual Engine Result:", result);
}
main().finally(() => prisma.$disconnect());
