const fs = require('fs');
let c = fs.readFileSync('src/app/api/auth/callback/route.ts', 'utf8');

c = c.replace(/    \/\/ 3\. Prevent deleted users from signing in[\s\S]*?    if \(existingLocalUser\?\.status === "DELETED"\) \{[\s\S]*?      return NextResponse\.redirect\(new URL\("\/\?error=account_deleted", request\.url\)\);\r?\n    \}/, 
`    // 3. Reactivate DELETED users if they sign back in via Roviara
    const existingLocalUser = await prisma.user.findUnique({ where: { roviaraId } });
    let isRevived = false;
    if (existingLocalUser?.status === "DELETED") {
      // They are reviving their account
      isRevived = true;
    }`);

c = c.replace(/        update: \{/, 
`        update: {
          ...(isRevived ? {
            status: "ACTIVE",
            idVerificationStatus: "UNVERIFIED",
            idCardUrl: null,
            phone: null
          } : {}),`);

fs.writeFileSync('src/app/api/auth/callback/route.ts', c);
