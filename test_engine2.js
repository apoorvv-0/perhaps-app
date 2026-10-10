const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEngine() {
  const eventId = '1407c735-6257-49b9-8d28-d6e79dac157e';
  const participants = await prisma.eventRegistration.findMany({
    where: { eventId, user: { idVerificationStatus: 'APPROVED' } },
    include: { user: true },
  }).then(regs =>
    regs.filter(r => r.user.status === 'ACTIVE' || r.user.status === 'SUSPENDED')
      .map(r => ({
        userId: r.userId,
        gender: r.user.gender,
        signupTime: r.createdAt,
        status: r.user.status,
      }))
  );

  const choices = await prisma.choice.findMany({
    where: { eventId },
    select: { pickerId: true, pickedId: true, rank: true },
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
    
    matches.push({ user1Id, user2Id, matchStrength: pair.strength });
  }

  const apoorvMatches = matches.filter(m => m.user1Id === 'b9b27b45-505c-4196-9b4f-b5ac50b56fba' || m.user2Id === 'b9b27b45-505c-4196-9b4f-b5ac50b56fba');
  console.log('Apoorv match:', apoorvMatches);
  
  const tantrumMatches = matches.filter(m => m.user1Id === '5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a' || m.user2Id === '5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a');
  console.log('Tantrum match:', tantrumMatches);

  console.log('Candidate pairs containing Apoorv:', candidatePairs.filter(c => c.userAId === 'b9b27b45-505c-4196-9b4f-b5ac50b56fba' || c.userBId === 'b9b27b45-505c-4196-9b4f-b5ac50b56fba'));
}

testEngine().finally(() => prisma.$disconnect());
