const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const activeEvent = await prisma.event.findFirst({
      where: { status: { not: 'ARCHIVED' } }
    });
    
    if (!activeEvent) {
      console.log("No active event found!");
      return;
    }

    // 1. Find Aditi Jonnalagadda
    const aditi = await prisma.user.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'aditi', mode: 'insensitive' } },
          { firstName: { contains: 'aiditi', mode: 'insensitive' } },
        ],
        lastName: { contains: 'jonnal', mode: 'insensitive' }
      }
    });

    if (aditi) {
      await prisma.eventRegistration.upsert({
        where: { eventId_userId: { eventId: activeEvent.id, userId: aditi.id } },
        create: { eventId: activeEvent.id, userId: aditi.id },
        update: {}
      });
      console.log(`Successfully registered Aditi: ${aditi.firstName} ${aditi.lastName} (${aditi.id})`);
    } else {
      console.log("Could not find Aditi Jonnalagadda");
    }

    // 2. Remove Yash D and Ayush Kumbhar
    const usersToRemove = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'yash', mode: 'insensitive' }, lastName: { contains: 'd', mode: 'insensitive' } },
          { firstName: { contains: 'ayush', mode: 'insensitive' }, lastName: { contains: 'kumbhar', mode: 'insensitive' } }
        ]
      }
    });

    for (const u of usersToRemove) {
      await prisma.eventRegistration.deleteMany({
        where: { userId: u.id, eventId: activeEvent.id }
      });
      console.log(`Successfully unregistered: ${u.firstName} ${u.lastName} (${u.id})`);
    }

    // 3. Get list of people registered but not verified
    const unverifiedRegs = await prisma.eventRegistration.findMany({
      where: {
        eventId: activeEvent.id,
        user: { idVerificationStatus: { not: 'APPROVED' } }
      },
      include: { user: true }
    });

    console.log("\n--- LIST OF REGISTERED BUT NOT VERIFIED USERS ---");
    if (unverifiedRegs.length === 0) {
      console.log("None! All registered users are verified.");
    } else {
      unverifiedRegs.forEach(reg => {
        console.log(`- ${reg.user.firstName} ${reg.user.lastName} (Status: ${reg.user.idVerificationStatus})`);
      });
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
