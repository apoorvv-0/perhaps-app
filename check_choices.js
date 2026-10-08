require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst();
  console.log("Event:", event.id, event.status);

  const choices = await prisma.choice.findMany();
  console.log("Choices:", choices);

  const participants = await prisma.eventRegistration.findMany({
    include: { user: true }
  });
  console.log("Participants:", participants.length);
  
  const matches = await prisma.match.findMany();
  console.log("Committed Matches:", matches);
}
main().catch(console.error).finally(() => prisma.$disconnect());
