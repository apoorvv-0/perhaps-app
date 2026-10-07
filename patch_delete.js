const fs = require('fs');
let code = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');

if (!code.includes('COOKIE_NAME')) {
  code = code.replace(
    /import \{ verifyToken \} from "@\/lib\/auth\/session-core";/,
    'import { verifyToken, COOKIE_NAME } from "@/lib/auth/session-core";'
  );
}

code = code.replace(
  `const sessionToken = cookieStore.get('session')?.value;`,
  `const sessionToken = cookieStore.get(COOKIE_NAME)?.value;`
);

fs.writeFileSync('src/app/api/profile/route.ts', code);
