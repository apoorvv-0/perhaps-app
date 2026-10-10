import { PrismaClient } from '@prisma/client';
import { runMatchingEngine } from './src/lib/matching/engine';

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
        gender: r.user.gender as "MALE" | "FEMALE",
        signupTime: r.createdAt,
        status: r.user.status as "ACTIVE" | "SUSPENDED",
      }))
  );

  const choices = await prisma.choice.findMany({
    where: { eventId },
    select: { pickerId: true, pickedId: true, rank: true },
  });

  console.log(`Running engine with ${participants.length} participants and ${choices.length} choices`);

  const result = runMatchingEngine({ participants, choices });
  
  console.log("Matches:", result.matches.length);
  
  const apoorvMatches = result.matches.filter(m => m.user1Id === 'b9b27b45-505c-4196-9b4f-b5ac50b56fba' || m.user2Id === 'b9b27b45-505c-4196-9b4f-b5ac50b56fba');
  console.log('Apoorv matches:', apoorvMatches);
  
  const tantrumMatches = result.matches.filter(m => m.user1Id === '5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a' || m.user2Id === '5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a');
  console.log('Tantrum matches:', tantrumMatches);

  return prisma;
}

testEngine().then(p => p.$disconnect()).catch(console.error);
