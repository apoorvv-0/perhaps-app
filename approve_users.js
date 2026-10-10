const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const usersToApprove = [
    'Yug Jain',
    'shivansh chaube',
    'Devansh Bodlawar',
    'Mayur Dhemabare',
    'Bhumi Yalamar',
    'Nidhi Sankalecha',
    'Saniya Mhatre',
    'Prakash Bhawal',
    'Tanishka Katare',
    'Sae Rajale',
    'Aditya Jagdale'
  ];

  for (const name of usersToApprove) {
    const parts = name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    
    await prisma.user.updateMany({
      where: {
        firstName: { contains: first, mode: 'insensitive' },
        lastName: { contains: last, mode: 'insensitive' }
      },
      data: {
        idVerificationStatus: 'APPROVED'
      }
    });
    console.log(`Approved: ${name}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
