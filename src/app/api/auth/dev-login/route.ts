import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const { testId = "dev-user-1" } = await request.json();
  const googleId = `fake-google-${testId}`;
  
  // Decide globalRole based on testId (if it contains 'admin', make them SUPER_ADMIN)
  const isSuperAdmin = testId.includes("admin");
  const globalRole = isSuperAdmin ? "SUPER_ADMIN" : "USER";

  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (!user) {
    const stablePhone = `91${testId.split("").map((c: string) => c.charCodeAt(0) % 10).join("").padEnd(10, "0").slice(0, 10)}`;
    user = await prisma.user.create({
      data: {
        googleId,
        phoneNumber: stablePhone,
        globalRole,
        status: "ACTIVE",
      },
    });
  } else if (user.globalRole !== globalRole) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { globalRole },
    });
  }

  // Ensure a profile exists for every dev user
  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    const isMale = !testId.includes("2");
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        firstName: isMale ? "Male" : "Female",
        lastName: "TestUser",
        gender: isMale ? "MALE" : "FEMALE",
        college: "Seth GS Medical College",
        batch: "2022",
        instagramHandle: `testuser_${testId.replace(/[^a-z0-9]/gi, "_")}`,
      },
    });
  }

  // Ensure an event exists (globally)
  let event = await prisma.event.findFirst({
    where: { status: { notIn: ["ARCHIVED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!event) {
    event = await prisma.event.create({
      data: {
        name: "Perhaps 2026",
        slug: `medmutuals-2026`,
        targetCollege: "Seth GS Medical College",
        status: "DRAFT",
      },
    });
  }

  const phoneLinked = !user.phoneNumber.startsWith("pending:");
  const profileComplete = !!profile;

  await setSessionCookie({
    userId: user.id,
    globalRole: user.globalRole,
    phoneVerified: phoneLinked,
    profileComplete,
    pendingPhoneLink: false,
    googleId,
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    globalRole: user.globalRole,
    phoneVerified: phoneLinked,
    profileComplete,
  });
}
