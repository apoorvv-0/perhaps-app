require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanUp() {
  const result = await prisma.eventRegistration.deleteMany({
    where: {
      user: {
        idVerificationStatus: { not: 'APPROVED' }
      }
    }
  });
  console.log('Cleaned up unapproved registrations:', result.count);
}

cleanUp().finally(() => prisma.$disconnect());
