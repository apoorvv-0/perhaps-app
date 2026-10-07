const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const event = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log("Event phase:", event.status);

    const users = await prisma.user.findMany({ take: 2 });
    console.log("Users:", users.length);

    const cConfig = await prisma.appConfig.findUnique({ where: { key: 'colleges' } });
    console.log("AppConfig:", cConfig);

    const matches = await prisma.match.findMany({ take: 1 });
    console.log("Matches:", matches.length);

  } catch(e) {
    console.error("Prisma error:", e);
  }
}
main();
