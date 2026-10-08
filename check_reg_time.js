require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({orderBy:{createdAt:'desc'}});
  const r1 = await prisma.eventRegistration.findUnique({where:{eventId_userId:{eventId:event.id, userId:'5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a'}}});
  const r2 = await prisma.eventRegistration.findUnique({where:{eventId_userId:{eventId:event.id, userId:'61d9360b-5a44-4c43-a9a3-daa5885fc565'}}});
  console.log('R1 created:', r1.createdAt);
  console.log('R2 created:', r2.createdAt);
}
main().finally(() => prisma.$disconnect());
