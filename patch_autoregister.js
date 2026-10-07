const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/callback/route.ts', 'utf8');

if (!code.includes('getActiveEvent')) {
  code = code.replace(
    /import \{ setSessionCookie \} from "@\/lib\/auth\/session";/,
    'import { setSessionCookie } from "@/lib/auth/session";\nimport { getActiveEvent } from "@/lib/event-service";'
  );
  
  code = code.replace(
    `await setSessionCookie({\n      userId: localUser.id,\n      globalRole: localUser.globalRole as any,\n      phoneVerified: true, // Inherited from Roviara completion\n      profileComplete: true\n    });`,
    `await setSessionCookie({\n      userId: localUser.id,\n      globalRole: localUser.globalRole as any,\n      phoneVerified: true,\n      profileComplete: true\n    });\n\n    const event = await getActiveEvent();\n    if (event && event.status === "REGISTRATION_OPEN") {\n      await prisma.eventRegistration.upsert({\n        where: { eventId_userId: { eventId: event.id, userId: localUser.id } },\n        create: { eventId: event.id, userId: localUser.id },\n        update: {}\n      });\n    }`
  );
  
  fs.writeFileSync('src/app/api/auth/callback/route.ts', code);
}
