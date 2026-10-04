import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";
import { setSessionCookie } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing SSO token" }, { status: 400 });
  }

  try {
    // 1. Verify the short-lived SSO Token from Roviara
    const secret = new TextEncoder().encode(process.env.INTER_APP_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const roviaraId = payload.roviaraId as string;

    if (!roviaraId) {
      throw new Error("Invalid token payload");
    }

    // 2. Fetch the latest user profile from Roviara API
    const roviaraUrl = process.env.NEXT_PUBLIC_ROVIARA_URL || "http://localhost:3001";
    const syncRes = await fetch(`${roviaraUrl}/api/sync/user?roviaraId=${roviaraId}`, {
      headers: {
        Authorization: `Bearer ${process.env.INTER_APP_SECRET}`
      }
    });

    if (!syncRes.ok) {
      throw new Error("Failed to sync user data from Roviara Hub");
    }

    const roviaraData = await syncRes.json();
    const profile = roviaraData.profile;

    if (!profile) {
      // The user hasn't completed their profile on Roviara
      return NextResponse.redirect(new URL("/login?error=incomplete_profile", request.url));
    }

    // 3. Upsert the user into the local database
    const localUser = await prisma.user.upsert({
      where: { roviaraId },
      update: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        instagramHandle: profile.instagramHandle,
        gender: profile.gender,
        college: profile.college,
        batch: profile.batch,
        globalRole: roviaraData.globalRole,
        status: roviaraData.status
      },
      create: {
        roviaraId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        instagramHandle: profile.instagramHandle,
        gender: profile.gender,
        college: profile.college,
        batch: profile.batch,
        globalRole: roviaraData.globalRole,
        status: roviaraData.status
      }
    });

    // 4. Create local session
    await setSessionCookie({
      userId: localUser.id,
      globalRole: localUser.globalRole as any,
      phoneVerified: true, // Inherited from Roviara completion
      profileComplete: true
    });

    // 5. Redirect into the app
    return NextResponse.redirect(new URL("/dashboard", request.url));

  } catch (error) {
    console.error("SSO Callback Error:", error);
    return NextResponse.json({ error: "SSO Authentication Failed" }, { status: 401 });
  }
}

export const dynamic = "force-dynamic";
