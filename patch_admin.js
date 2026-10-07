const fs = require('fs');
let code = fs.readFileSync('src/app/api/admin/users/route.ts', 'utf8');

code = code.replace(
  `  const { userId, status, minChoiceExempt, toggleEventRole, profile } = body;`,
  `  const { userId, status, minChoiceExempt, toggleEventRole, profile } = body;

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { globalRole: true } });
  if (targetUser?.globalRole === "SUPER_ADMIN" && session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admins can modify another Super Admin." }, { status: 403 });
  }`
);

fs.writeFileSync('src/app/api/admin/users/route.ts', code);
