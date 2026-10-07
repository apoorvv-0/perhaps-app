import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  signSession,
  verifyToken,
  COOKIE_NAME,
  SessionPayload,
} from "./session-core";

export * from "./session-core";

const EXPIRY_HOURS = parseInt(process.env.JWT_EXPIRY_HOURS ?? "72", 10);

// ─────────────────────────────────────────────
// Set session cookie
// ─────────────────────────────────────────────

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRY_HOURS * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─────────────────────────────────────────────
// Authorization Guards (Event Marketplace)
// ─────────────────────────────────────────────

/**
 * Checks if a user has a specific role for a specific event.
 * SUPER_ADMIN users automatically pass all role checks for all events.
 */
export async function hasEventRole(
  userId: string,
  eventId: string,
  role: "ADMIN" | "CASHIER"
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true },
  });

  if (!user) return false;
  if (user.globalRole === "SUPER_ADMIN") return true;

  const eventRole = await prisma.eventRole.findUnique({
    where: {
      eventId_userId_role: {
        eventId,
        userId,
        role,
      },
    },
  });

  return !!eventRole;
}

