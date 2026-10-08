require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log("Current Event:", event.id);

  const u1 = "5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a";
  const u2 = "61d9360b-5a44-4c43-a9a3-daa5885fc565";

  const p1 = await prisma.user.findUnique({ where: { id: u1 }, include: { eventRegistrations: true } });
  const p2 = await prisma.user.findUnique({ where: { id: u2 }, include: { eventRegistrations: true } });

  console.log("P1:", p1.firstName, p1.gender, p1.status, "Registrations:", p1.eventRegistrations.map(r => r.eventId));
  console.log("P2:", p2.firstName, p2.gender, p2.status, "Registrations:", p2.eventRegistrations.map(r => r.eventId));

  const existingCommit = await prisma.matchingExecution.findFirst({
    where: { eventId: event.id, isDryRun: false },
  });
  console.log("Existing commit:", existingCommit);

  const matches = await prisma.match.findMany({ where: { eventId: event.id } });
  console.log("Matches for current event:", matches.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
