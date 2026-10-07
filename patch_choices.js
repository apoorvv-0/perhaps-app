const fs = require('fs');
let code = fs.readFileSync('src/app/api/choices/route.ts', 'utf8');

const validationLogic = `  if (pickedIds.includes(session.userId)) {
    return NextResponse.json({ error: "You cannot pick yourself." }, { status: 400 });
  }

  const pickerUser = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!pickerUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  if (pickedIds.length > 0) {
    const validTargets = await prisma.user.findMany({
      where: {
        id: { in: pickedIds },
        status: "ACTIVE",
        gender: pickerUser.gender === "MALE" ? "FEMALE" : "MALE",
        eventRegistrations: { some: { eventId: event.id } }
      }
    });
    
    if (validTargets.length !== pickedIds.length) {
      return NextResponse.json({ error: "One or more selected users are invalid, inactive, or not participating." }, { status: 400 });
    }
  }`;

code = code.replace(
  `  if (pickedIds.includes(session.userId)) {\n    return NextResponse.json({ error: "You cannot pick yourself." }, { status: 400 });\n  }`,
  validationLogic
);

fs.writeFileSync('src/app/api/choices/route.ts', code);
