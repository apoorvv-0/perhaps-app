const fs = require('fs');
let c = fs.readFileSync('src/app/api/admin/event/route.ts', 'utf8');

c = c.replace(
  /const newEvent = await prisma\.event\.updateMany\([\s\S]*?await prisma\.event\.create\([\s\S]*?\}\);/m,
  `await prisma.event.updateMany({
      where: { status: { not: 'ARCHIVED' } },
      data: { status: 'ARCHIVED' },
    });
    
    const newEvent = await prisma.event.create({
      data: {
        name,
        slug,
        status: "DRAFT",
        colleges: "[]",
        batches: "[]",
      },
    });`
);

fs.writeFileSync('src/app/api/admin/event/route.ts', c);
console.log("Replaced!");
