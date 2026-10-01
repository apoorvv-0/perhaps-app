const fs = require('fs');
let c = fs.readFileSync('src/app/api/auth/google/verify/route.ts', 'utf8');

c = c.replace(
  /return NextResponse.json\([\s\S]*?status: 403\s*\}\s*\);/,
  `user = await prisma.user.create({
      data: {
        googleId,
        phoneNumber: \`pending:\${googleId}\`,
        globalRole: "USER",
        status: "ACTIVE",
      },
    });`
);

fs.writeFileSync('src/app/api/auth/google/verify/route.ts', c);
