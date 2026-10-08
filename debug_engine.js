require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { runMatchingEngine } = require('./src/lib/matching/engine.ts'); // Need to compile or mock it

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

  console.log("Participants:", participants);
  console.log("Choices:", frozenChoices);

  // Re-implement the loop to see where it breaks
  const participantMap = new Map(participants.map((p) => [p.userId, p]));
  const choiceMap = new Map();
  for (const c of frozenChoices) {
    if (!choiceMap.has(c.pickerId)) choiceMap.set(c.pickerId, new Map());
    choiceMap.get(c.pickerId).set(c.pickedId, c.rank);
  }

  const candidatePairs = [];
  const seenPairs = new Set();

  for (const [pickerId, picks] of choiceMap) {
    const pickerParticipant = participantMap.get(pickerId);
    if (!pickerParticipant) { console.log("Missing picker:", pickerId); continue; }
    if (pickerParticipant.status !== "ACTIVE") { console.log("Inactive picker:", pickerId); continue; }

    for (const [pickedId, rankAtoB] of picks) {
      const pairKey = [pickerId, pickedId].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const pickedParticipant = participantMap.get(pickedId);
      if (!pickedParticipant) { console.log("Missing picked:", pickedId); continue; }
      if (pickedParticipant.status !== "ACTIVE") { console.log("Inactive picked:", pickedId); continue; }

      if (pickerParticipant.gender === pickedParticipant.gender) {
        console.log("Same gender!", pickerParticipant.gender, pickedParticipant.gender);
        continue;
      }

      const rankBtoA = choiceMap.get(pickedId)?.get(pickerId);
      if (rankBtoA === undefined) {
        console.log("Not mutual:", pickerId, pickedId);
        continue;
      }

      console.log("Found mutual pair!", pickerId, pickedId);
      candidatePairs.push({ userA: pickerId, userB: pickedId });
    }
  }
  
  console.log("Candidate Pairs:", candidatePairs);
}
main().finally(() => prisma.$disconnect());
