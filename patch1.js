const fs = require('fs');

// C-2 + L-11: Rewrite src/app/api/auth/google/verify/route.ts
const authGoogleVerify = `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";

interface GoogleTokenPayload {
  sub: string; email: string; name?: string; picture?: string; aud: string; exp: number;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(\`https://oauth2.googleapis.com/tokeninfo?id_token=\${idToken}\`);
    if (!res.ok) return null;
    const payload = (await res.json()) as GoogleTokenPayload;
    if (payload.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) { console.warn("[GoogleAuth] Token audience mismatch"); return null; }
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

const bodySchema = z.object({ 
  idToken: z.string().min(1),
  ageConsent: z.boolean().optional(),
  dataConsent: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "idToken is required" }, { status: 400 });

  const { idToken, ageConsent, dataConsent } = parsed.data;
  const googlePayload = await verifyGoogleIdToken(idToken);
  if (!googlePayload) return NextResponse.json({ error: "Invalid or expired Google token" }, { status: 401 });

  const { sub: googleId } = googlePayload;

  let user = await prisma.user.findUnique({ where: { googleId } });
  if (!user) {
    user = await prisma.user.create({
      data: { 
        googleId, 
        phoneNumber: \`pending:\${googleId}\`, 
        globalRole: "USER", 
        status: "ACTIVE",
        consentGivenAt: ageConsent && dataConsent ? new Date() : null,
        consentVersion: ageConsent && dataConsent ? "v1.0" : null
      },
    });
  }

  if (user.status === "SUSPENDED") return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });

  const phoneLinked = !user.phoneNumber.startsWith("pending:");
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const profileComplete = !!profile;

  await setSessionCookie({
    userId: user.id, globalRole: user.globalRole,
    phoneVerified: phoneLinked, profileComplete,
    pendingPhoneLink: !phoneLinked, googleId,
  });

  return NextResponse.json({ userId: user.id, phoneVerified: phoneLinked, profileComplete, requiresPhoneLink: !phoneLinked });
}`;
fs.writeFileSync('src/app/api/auth/google/verify/route.ts', authGoogleVerify);
console.log('Done C-2');

// L-10 + L-11: prisma/schema.prisma
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace('// Deprecated: replaced by targetCollege, keeping for backwards compat logic temporarily', '// Legacy multi-college support field. Still used in profile validation.');
if (!schema.includes('consentGivenAt')) {
  schema = schema.replace(/(model User \{[\s\S]*?)(^\})/m, '$1  consentGivenAt DateTime?\n  consentVersion String?\n$2');
}
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Done schema');

// C-5: src/app/api/auth/me/route.ts
let authMe = fs.readFileSync('src/app/api/auth/me/route.ts', 'utf8');
authMe = authMe.replace(/return NextResponse\.json\(\{\s*session:\s*null\s*\}\s*(?:,\s*\{\s*status:\s*200\s*\}\s*)?\);?/g, "return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });");
fs.writeFileSync('src/app/api/auth/me/route.ts', authMe);
console.log('Done C-5 api');

// C-5: src/components/AuthProvider.tsx
let authProvider = fs.readFileSync('src/components/AuthProvider.tsx', 'utf8');
if (authProvider.includes('const data = await res.json()') && !authProvider.includes('if (!res.ok)')) {
  authProvider = authProvider.replace(/const res = await fetch\(['"`]\/api\/auth\/me['"`]\);?\s*(const data = await res\.json\(\);?)/, "const res = await fetch('/api/auth/me');\n        if (!res.ok) { setSession(null); return; }\n        $1");
}
fs.writeFileSync('src/components/AuthProvider.tsx', authProvider);
console.log('Done C-5 provider');

// C-3 + C-4: middleware.ts
let middleware = fs.readFileSync('src/middleware.ts', 'utf8');
if (!middleware.includes('/roviara/:path*')) {
  middleware = middleware.replace(/matcher:\s*\[([^\]]*)\]/, (match, p1) => {
    return `matcher: [${p1}, '/roviara/:path*']`;
  });
}
if (!middleware.includes("session.globalRole === 'SUPER_ADMIN'")) {
  middleware = middleware.replace(/if\s*\(\s*pathname\.startsWith\('\/admin'\)\s*\|\|\s*pathname\.startsWith\('\/cashier'\)\s*\)\s*\{\s*if\s*\(!session\)\s*\{/g, `if (pathname.startsWith('/admin') || pathname.startsWith('/cashier') || (pathname.startsWith('/roviara') && !pathname.startsWith('/roviara/login'))) {
    if (!session || session.globalRole !== 'SUPER_ADMIN') {`);
}
fs.writeFileSync('src/middleware.ts', middleware);
console.log('Done C-3+4');

// H-2, H-3, H-4: src/app/api/directory/route.ts
let dirRoute = fs.readFileSync('src/app/api/directory/route.ts', 'utf8');
dirRoute = dirRoute.replace(/event\.status !== 'CHOOSING_OPEN'/g, "event.status !== 'CHOOSING_OPEN' && event.status !== 'CHOOSING_CLOSED'");
dirRoute = dirRoute.replace(/return NextResponse\.json\(\{/, "return NextResponse.json({ eventPhase: event.status,");
dirRoute = dirRoute.replace(/take:\s*PAGE_SIZE\s*,/, "");
dirRoute = dirRoute.replace(/skip:\s*skip\s*,/, "");
fs.writeFileSync('src/app/api/directory/route.ts', dirRoute);
console.log('Done H-2,3,4');

// H-5, M-26: src/app/api/admin/event/route.ts
let adminEvent = fs.readFileSync('src/app/api/admin/event/route.ts', 'utf8');
adminEvent = adminEvent.replace(/const body = await req\.json\(\);?/, `let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }`);
adminEvent = adminEvent.replace(/await prisma\.event\.create\(\{/g, `await prisma.event.updateMany({
        where: { status: { not: 'ARCHIVED' } },
        data: { status: 'ARCHIVED' },
      });\n      await prisma.event.create({`);
fs.writeFileSync('src/app/api/admin/event/route.ts', adminEvent);
console.log('Done H-5, M-26');

// H-6: src/app/api/auth/otp/send/route.ts
let otpSend = fs.readFileSync('src/app/api/auth/otp/send/route.ts', 'utf8');
if (!otpSend.includes('normalizeIndiaPhone')) {
  otpSend = `import { normalizeIndiaPhone } from "@/lib/auth/otp";\n` + otpSend;
}
otpSend = otpSend.replace(/const formattedPhone = phone\.startsWith\('\+91'\) \? phone : \`\+91\$\{phone\}\`;/g, "const formattedPhone = normalizeIndiaPhone(phone);");
fs.writeFileSync('src/app/api/auth/otp/send/route.ts', otpSend);
console.log('Done H-6');
