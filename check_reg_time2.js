require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u1 = await prisma.eventRegistration.findFirst({where: {userId: '5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a'}});
  const u2 = await prisma.eventRegistration.findFirst({where: {userId: '61d9360b-5a44-4c43-a9a3-daa5885fc565'}});
  console.log('U1 reg:', u1.createdAt);
  console.log('U2 reg:', u2.createdAt);
}
main().finally(()=>prisma.$disconnect());
