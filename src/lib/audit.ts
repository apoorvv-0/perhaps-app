/**
 * Audit Log Service
 *
 * Every admin action that touches user data or system state must go through here.
 * Visible to all Super Admins. Cannot be deleted.
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction =
  // Auth & Identity
  | "USER_CREATED"
  | "USER_SUSPENDED"
  | "USER_RESTORED"
  | "USER_DELETED"
  // Choice Access (single-admin standing access — Decision #20)
  | "VIEW_USER_CHOICES"
  // Event Lifecycle
  | "EVENT_CREATED"
  | "EVENT_PHASE_CHANGED"
  | "EVENT_PHASE_OVERRIDE" // emergency reopen
  | "EVENT_TIMER_UPDATED"
  | "EVENT_CANCELLED"
  // Matching
  | "MATCHING_DRY_RUN"
  | "MATCHING_COMMITTED"
  // Results
  | "RESULTS_PUBLISHED"
  | "LEADERBOARD_PUBLISHED"
  | "LEADERBOARD_TAKEDOWN"
  // Coupons
  | "COUPON_ISSUED"
  | "COUPON_REDEEMED"
  | "COUPON_VOIDED"
  // Purge
  | "DATA_PURGE_INITIATED";

export interface CreateAuditLogInput {
  adminId: string;
  action: AuditAction;
  targetUserId?: string;
  eventId?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetUserId: input.targetUserId,
      eventId: input.eventId,
      reason: input.reason,
      metadata: input.metadata,
    },
  });
}

/**
 * Notify all Super Admins of a sensitive access (Decision #20).
 * In V1, this writes to AuditLog (visible in admin dashboard).
 * Future: hook into a real notification system (email/Slack).
 */
export async function notifySuperAdminsOfChoiceAccess(
  adminId: string,
  targetUserId: string,
  reason: string
): Promise<void> {
  await createAuditLog({
    adminId,
    action: "VIEW_USER_CHOICES",
    targetUserId,
    reason,
    metadata: {
      notifiedSuperAdmins: true,
      timestamp: new Date().toISOString(),
    },
  });
}
