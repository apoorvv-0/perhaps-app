require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startLaunch() {
  console.log("Preparing app for launch...");
  
  // Archive old events
  await prisma.event.updateMany({
    where: { status: { not: 'ARCHIVED' } },
    data: { status: 'ARCHIVED' }
  });
  
  // Create fresh launch event
  const newEvent = await prisma.event.create({
    data: {
      name: "Launch Event",
      slug: "launch-event-" + Date.now(),
      status: "REGISTRATION_OPEN",
      colleges: "[]",
      batches: "[]"
    }
  });
  
  console.log("Created Launch Event:", newEvent.id);
  console.log("Status: REGISTRATION_OPEN");
  console.log("App is ready for launch!");
}

startLaunch().finally(() => prisma.$disconnect());
