const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const eventId = '1407c735-6257-49b9-8d28-d6e79dac157e';

  // We rewrite the matching logic locally just to test
  const participants = await prisma.eventRegistration.findMany({
    where: { eventId, user: { idVerificationStatus: 'APPROVED' } },
    include: { user: true }
  }).then(regs => regs.filter(r => r.user.status === 'ACTIVE' || r.user.status === 'SUSPENDED').map(r => ({
    userId: r.userId, gender: r.user.gender, signupTime: r.createdAt, status: r.user.status
  })));

  const choices = await prisma.choice.findMany({
    where: { eventId }, select: { pickerId: true, pickedId: true, rank: true }
  });

  const participantMap = new Map(participants.map(p => [p.userId, p]));
  const choiceMap = new Map();
  for (const c of choices) {
    if (!choiceMap.has(c.pickerId)) choiceMap.set(c.pickerId, new Map());
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
      
      candidatePairs.push({
        userAId: pickerId, userBId: pickedId,
        strength: rankAtoB + rankBtoA,
        worseRank: Math.max(rankAtoB, rankBtoA),
        earlierSignup: pickerParticipant.signupTime < pickedParticipant.signupTime ? pickerParticipant.signupTime : pickedParticipant.signupTime,
        laterSignup: pickerParticipant.signupTime > pickedParticipant.signupTime ? pickerParticipant.signupTime : pickedParticipant.signupTime,
        canonicalLowerId: pickerId < pickedId ? pickerId : pickedId,
      });
    }
  }

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
  const sampleMatches = [];
  for (const pair of candidatePairs) {
    if (matched.has(pair.userAId) || matched.has(pair.userBId)) continue;
    matched.add(pair.userAId); matched.add(pair.userBId);
    const user1Id = pair.userAId < pair.userBId ? pair.userAId : pair.userBId;
    const user2Id = pair.userAId < pair.userBId ? pair.userBId : pair.userAId;
    sampleMatches.push({ user1Id, user2Id, matchStrength: pair.strength });
  }

  const userIds = [...new Set(sampleMatches.flatMap(m => [m.user1Id, m.user2Id]))];
  const profiles = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, college: true, batch: true }
  });
  
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const previewMatches = sampleMatches.map(m => ({
     user1: profileMap.get(m.user1Id),
     user2: profileMap.get(m.user2Id),
     matchStrength: m.matchStrength
  }));

  console.log("previewMatches count:", previewMatches.length);
  const meMatch = previewMatches.find(m => m.user1?.firstName === 'Apoorv' || m.user2?.firstName === 'Apoorv');
  console.log("Me Match:", meMatch);
}

run().finally(() => prisma.$disconnect());
