const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const apoorv = await prisma.user.findFirst({
    where: { firstName: { contains: 'apoorv', mode: 'insensitive' } }
  });
  
  const tantrum = await prisma.user.findFirst({
    where: {
      OR: [
        { firstName: { contains: 'tantrum', mode: 'insensitive' } },
        { lastName: { contains: 'queen', mode: 'insensitive' } }
      ]
    }
  });

  console.log('Apoorv:', apoorv?.id, apoorv?.firstName, apoorv?.lastName, apoorv?.idVerificationStatus);
  console.log('Tantrum:', tantrum?.id, tantrum?.firstName, tantrum?.lastName, tantrum?.idVerificationStatus);

  if (apoorv && tantrum) {
    const choices = await prisma.choice.findMany({
      where: {
        OR: [
          { pickerId: apoorv.id, pickedId: tantrum.id },
          { pickerId: tantrum.id, pickedId: apoorv.id }
        ]
      }
    });
    console.log('Choices between them:', choices);
  }
}

run().finally(() => prisma.$disconnect());
