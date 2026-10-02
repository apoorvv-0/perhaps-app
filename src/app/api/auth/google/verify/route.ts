import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";

interface GoogleTokenPayload {
  sub: string; email: string; name?: string; picture?: string; aud: string; exp: number;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
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
        phoneNumber: `pending:${googleId}`, 
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
}