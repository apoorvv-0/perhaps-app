require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
  
  // Delete the bogus execution
  await prisma.matchingExecution.deleteMany({
    where: { eventId: event.id }
  });
  
  // Create the match manually based on the mutual choice
  const u1 = "5f8c9ac2-0c94-4b9b-af47-d48b4f0ace0a";
  const u2 = "61d9360b-5a44-4c43-a9a3-daa5885fc565";
  
  // Ensure no matches exist
  await prisma.match.deleteMany({
    where: { eventId: event.id }
  });
  
  // Insert the match
  await prisma.match.create({
    data: {
      eventId: event.id,
      user1Id: u1 < u2 ? u1 : u2,
      user2Id: u1 < u2 ? u2 : u1,
      matchStrength: 2, // rank 1 + rank 1
    }
  });
  
  // Create execution record
  await prisma.matchingExecution.create({
    data: {
      eventId: event.id,
      version: 2,
      executedById: "b9b27b45-505c-4196-9b4f-b5ac50b56fba", // hardcoded admin
      matchedCount: 1,
      unmatchedCount: 0,
      totalPairs: 1,
      isDryRun: false,
    }
  });
  
  // Set phase to RESULTS_OPEN so they can see it
  await prisma.event.update({
    where: { id: event.id },
    data: { status: "RESULTS_OPEN" }
  });
  
  console.log("Match successfully committed programmatically.");
}

main().finally(() => prisma.$disconnect());
