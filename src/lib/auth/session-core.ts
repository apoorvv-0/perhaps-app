import { SignJWT, jwtVerify } from "jose";
// removed Role and hasRole

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  globalRole: "USER" | "SUPER_ADMIN";
  phoneVerified: boolean;
  profileComplete: boolean;
  /** Intermediate state: Google linked but phone not yet verified */
  pendingPhoneLink?: boolean;
  googleId?: string;
}

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "INSECURE_DEV_ONLY_SECRET_CHANGE_IN_PRODUCTION"
);
const EXPIRY_HOURS = parseInt(process.env.JWT_EXPIRY_HOURS ?? "72", 10);
export const COOKIE_NAME = "mm_session";

// ─────────────────────────────────────────────
// Sign a new session token
// ─────────────────────────────────────────────

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_HOURS}h`)
    .sign(SECRET);
}

// ─────────────────────────────────────────────
// Verify a token string
// ─────────────────────────────────────────────

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch (err) { console.error('[DEBUG] verifyToken failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// Role guard helpers
// ─────────────────────────────────────────────

// Roles are now checked dynamically per-event via the DB
