import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/session-core";
import { prisma } from "@/lib/db/prisma";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  instagramHandle: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/, "Invalid Instagram handle")
    .transform((v) => v.replace(/^@/, "")),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  college: z.string().min(1).max(100).optional(),
  batch: z.string().min(1).max(20).optional(),
  leaderboardOptIn: z.boolean().optional().default(true),
  ageAttestation: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session?.idVerificationStatus === "APPROVED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === "SUSPENDED" || user.firstName === "New") return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: user });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.idVerificationStatus === "APPROVED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const event = await getActiveEvent();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id: session.userId } });

  // If user already has verified details, prevent editing them
  if (existing && existing.firstName && existing.firstName !== "New") {
    if (data.gender && existing.gender && data.gender !== existing.gender) {
      return NextResponse.json({ error: "Gender cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
    if (data.college && existing.college && data.college !== existing.college) {
      return NextResponse.json({ error: "College cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
    if (data.batch && existing.batch && data.batch !== existing.batch) {
      return NextResponse.json({ error: "Batch cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
    if (data.firstName && existing.firstName && data.firstName !== existing.firstName) {
      return NextResponse.json({ error: "Name cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
    if (data.lastName && existing.lastName && data.lastName !== existing.lastName) {
      return NextResponse.json({ error: "Name cannot be changed once set. Please contact an admin." }, { status: 403 });
    }
  }

  // Update only instagramHandle (plus verified fields on initial creation if not set yet)
  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      instagramHandle: data.instagramHandle,
      ...(existing?.firstName === "New" || !existing?.firstName ? {
        firstName: data.firstName || existing?.firstName || "",
        lastName: data.lastName || existing?.lastName || "",
        gender: data.gender || existing?.gender || "MALE",
        college: data.college || existing?.college || "",
        batch: data.batch || existing?.batch || "",
      } : {})
    }
  });

  if (event && event.status === "REGISTRATION_OPEN") {
    if (event.registrationEndAt && new Date() > new Date(event.registrationEndAt)) {
      console.log("Registration denied: Timer expired.");
    } else {
      await prisma.eventRegistration.upsert({
        where: { eventId_userId: { eventId: event.id, userId: session.userId } },
        create: { eventId: event.id, userId: session.userId },
        update: {},
      });
    }
  }

  await setSessionCookie({ ...session, profileComplete: true });
  return NextResponse.json({ ok: true, profile: user });
}

export const POST = PUT;

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const session = await verifyToken(sessionToken);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  await prisma.user.update({
    where: { id: session.userId },
    data: { status: 'SUSPENDED' }
  });
  
  return NextResponse.json({ success: true });
}
