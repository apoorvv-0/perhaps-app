const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const events = await prisma.event.findMany();
  const registrations = await prisma.eventRegistration.count();
  const choices = await prisma.choice.count();
  
  console.log(`Users: ${users}`);
  console.log(`Events: ${events.length}`);
  console.log(`Registrations: ${registrations}`);
  console.log(`Choices: ${choices}`);
  console.log(events);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
