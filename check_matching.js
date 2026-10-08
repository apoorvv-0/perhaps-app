require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const executions = await prisma.matchingExecution.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5
  });
  console.log("Executions:", executions);
  
  const event = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
  
  const snapshot = await prisma.eventRegistration.findMany({
    where: { eventId: event.id },
    include: { user: true }
  });
  console.log("Total registrations for event:", snapshot.length);
  
  const choices = await prisma.choice.findMany({ where: { eventId: event.id } });
  console.log("Total choices for event:", choices.length);
  
  const u1 = "5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a";
  const u2 = "61d9360b-5a44-4c43-a9a3-daa5885fc565";
  
  const c1 = choices.find(c => c.pickerId === u1 && c.pickedId === u2);
  const c2 = choices.find(c => c.pickerId === u2 && c.pickedId === u1);
  console.log("Mutual choice exists?", !!c1, !!c2);
  
  const user1 = snapshot.find(s => s.userId === u1)?.user;
  const user2 = snapshot.find(s => s.userId === u2)?.user;
  
  if (user1 && user2) {
    console.log("User 1:", user1.gender, user1.status);
    console.log("User 2:", user2.gender, user2.status);
  } else {
    console.log("One of the users is missing from registrations!");
  }
}
main().finally(() => prisma.$disconnect());
