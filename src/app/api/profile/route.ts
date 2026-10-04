import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session-core";
import { prisma } from "@/lib/db/prisma";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  instagramHandle: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/, "Invalid Instagram handle")
    .transform((v) => v.replace(/^@/, "")),
  gender: z.enum(["MALE", "FEMALE"]),
  college: z.string().min(1).max(100),
  batch: z.string().min(1).max(20),
  leaderboardOptIn: z.boolean().optional().default(true),
  ageAttestation: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session?.phoneVerified) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === "SUSPENDED" || user.firstName === "New") return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: user });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.phoneVerified) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const event = await getActiveEvent();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  const data = parsed.data;

  if (event) {
    let allowedColleges: string[] = [];
    let allowedBatches: string[] = [];
    try { allowedColleges = JSON.parse(event.colleges as string); allowedBatches = JSON.parse(event.batches as string); } catch {}
    if (allowedColleges.length > 0 && !allowedColleges.includes(data.college)) return NextResponse.json({ error: `Invalid college selection.` }, { status: 400 });
    if (allowedBatches.length > 0 && !allowedBatches.includes(data.batch)) return NextResponse.json({ error: `Invalid batch selection.` }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: session.userId } });
  if (existing && existing.firstName !== "New" && existing.gender !== "MALE" && existing.gender !== "FEMALE") {
      // Allow gender update if it was a mock default string, otherwise:
      if (existing.gender && data.gender !== existing.gender && (existing.gender as string) !== "New") {
          return NextResponse.json({ error: "Gender cannot be changed once set. Please contact an admin." }, { status: 403 });
      }
      if (existing.college && data.college !== existing.college && existing.college !== "New") {
          return NextResponse.json({ error: "College cannot be changed once set. Please contact an admin." }, { status: 403 });
      }
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      instagramHandle: data.instagramHandle,
      gender: data.gender,
      college: data.college,
      batch: data.batch,
    }
  });

  if (event) {
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId: session.userId } },
      create: { eventId: event.id, userId: session.userId },
      update: {},
    });
  }

  await setSessionCookie({ ...session, profileComplete: true });
  return NextResponse.json({ ok: true, profile: user });
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const session = await verifyToken(sessionToken);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  await prisma.user.update({
    where: { id: session.userId },
    data: { phoneNumber: `deleted:${session.userId}`, googleId: `deleted:${session.userId}`, status: 'SUSPENDED' }
  });
  
  return NextResponse.json({ success: true });
}
