const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const activeEvent = await prisma.event.findFirst({
    where: { status: { not: 'ARCHIVED' } }
  });
  
  if (!activeEvent) return;

  const yash = await prisma.user.findFirst({
    where: {
      firstName: { contains: 'yash', mode: 'insensitive' },
      lastName: { contains: 'dapke', mode: 'insensitive' }
    }
  });

  if (yash) {
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: activeEvent.id, userId: yash.id } },
      create: { eventId: activeEvent.id, userId: yash.id },
      update: {}
    });
    console.log(`Re-registered Yash Dapke: ${yash.id}`);
  } else {
    console.log("Could not find Yash Dapke");
  }
}

run().finally(() => prisma.$disconnect());
