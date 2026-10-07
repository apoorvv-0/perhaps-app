import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { SignJWT } from "jose";

/**
 * Perhaps → Roviara reverse SSO handoff.
 * Called by the "Roviara Hub" button on the Perhaps dashboard.
 * Generates a short-lived (1 min) token carrying the roviaraId
 * and redirects the browser to Roviara's /api/auth/handoff endpoint,
 * which will create a Roviara session and land on /superadmin.
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = process.env.INTER_APP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // The Perhaps session.userId IS the roviaraId (users are synced from Roviara)
  // We need the roviaraId stored in the Perhaps user record
  const { prisma } = await import("@/lib/db/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { roviaraId: true },
  });

  if (!user?.roviaraId) {
    return NextResponse.json({ error: "No Roviara account linked" }, { status: 400 });
  }

  const token = await new SignJWT({ roviaraId: user.roviaraId, purpose: "superadmin_handoff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1m")
    .sign(new TextEncoder().encode(secret));

  const roviaraUrl = process.env.NEXT_PUBLIC_ROVIARA_URL || "https://roviara-web.vercel.app";
  const handoffUrl = new URL("/api/auth/handoff", roviaraUrl);
  handoffUrl.searchParams.set("token", token);

  return NextResponse.redirect(handoffUrl.toString());
}

export const dynamic = "force-dynamic";
