const fs = require('fs');

const path = 'src/app/api/auth/google/verify/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
/  if \(!user\) \{\s*user = await prisma\.user\.create\(\{\s*data: \{\s*googleId,\s*phoneNumber: `pending:\$\{googleId\}`,\s*globalRole: "USER",\s*status: "ACTIVE",\s*\},\s*\}\);\s*\}/g,
`  if (!user) {
    return NextResponse.json(
      { error: "Account not found. You must create a Roviara ID at roviara.com first." },
      { status: 403 }
    );
  }`
);

fs.writeFileSync(path, code);
