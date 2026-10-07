import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { adminAuth } from "@/lib/firebase/server";
import { z } from "zod";

const schema = z.object({
  idToken: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify Firebase ID Token
    const decodedToken = await adminAuth.verifyIdToken(parsed.data.idToken);
    
    // The phone number format from Firebase is +91XXXXXXXXXX
    const firebasePhone = decodedToken.phone_number;
    if (!firebasePhone) {
      return NextResponse.json({ error: "No phone number found in token" }, { status: 400 });
    }

    // Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Since we trust firebase authentication, we will update the user's phone to the one they verified,
    // or just mark them as verified if we don't care if it matches exactly what they typed in registration.
    // Let's update their phone to the verified one to be absolutely certain it's theirs.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: firebasePhone,
        phoneVerified: true,
      }
    });

    // Update the JWT session
    await setSessionCookie({
      ...session,
      phoneVerified: true,
    });

    return NextResponse.json({ ok: true, phone: firebasePhone });

  } catch (error: any) {
    console.error("Phone Verify Error:", error);
    return NextResponse.json(
      { error: "Failed to verify token: " + error.message },
      { status: 500 }
    );
  }
}
