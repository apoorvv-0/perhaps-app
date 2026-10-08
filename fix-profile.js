const fs = require('fs');
let c = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');
c = c.replace('data: { status: "DELETED" }', 
`data: { status: "DELETED" }
    });

    // Completely erase their presence from the event
    await prisma.choice.deleteMany({ where: { pickerId: session.userId } });
    await prisma.choice.deleteMany({ where: { pickedId: session.userId } });
    await prisma.match.deleteMany({ where: { OR: [{ user1Id: session.userId }, { user2Id: session.userId }] } });
    //`);
fs.writeFileSync('src/app/api/profile/route.ts', c);
