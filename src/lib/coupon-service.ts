/**
 * Coupon Service
 *
 * Handles coupon issuance, redemption, and voiding.
 * Cashier role only for issue/void.
 * 8-character alphanumeric codes (cryptographically random).
 */

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit";
import crypto from "crypto";

// ─────────────────────────────────────────────
// Code Generation
// ─────────────────────────────────────────────

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes I, O, 0, 1 (ambiguous)
const CODE_LENGTH = 8;

function generateCouponCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCouponCode();
    const existing = await prisma.coupon.findUnique({ where: { id: code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique coupon code after 10 attempts");
}

// ─────────────────────────────────────────────
// Issue Coupon (Cashier)
// ─────────────────────────────────────────────

export interface IssueCouponInput {
  cashierId: string;
  faceValueRupees: number; // in rupees (stored as paise)
  buyerPhone: string;
  eventId?: string; // tag the coupon to the current event
}

export async function issueCoupon(input: IssueCouponInput) {
  const code = await generateUniqueCode();
  const faceValuePaise = Math.round(input.faceValueRupees * 100);

  const coupon = await prisma.coupon.create({
    data: {
      id: code,
      faceValue: faceValuePaise,
      buyerPhone: input.buyerPhone,
      cashierId: input.cashierId,
      eventId: input.eventId ?? null,
      status: "ISSUED",
    },
  });

  await createAuditLog({
    adminId: input.cashierId,
    action: "COUPON_ISSUED",
    metadata: {
      couponCode: code,
      faceValuePaise,
      buyerPhone: input.buyerPhone,
      eventId: input.eventId,
    },
  });

  return coupon;
}

// ─────────────────────────────────────────────
// Redeem Coupon (Student)
// ─────────────────────────────────────────────

export interface RedeemCouponInput {
  code: string;
  redeemedByUserId: string;
  requiredPaise?: number; // Optional face value required for this specific redemption
}

export type RedeemResult =
  | { ok: true; faceValuePaise: number }
  | { ok: false; error: string };

export async function redeemCoupon(
  input: RedeemCouponInput
): Promise<RedeemResult> {
  const coupon = await prisma.coupon.findUnique({ where: { id: input.code.toUpperCase() } });

  if (!coupon) {
    return { ok: false, error: "Invalid coupon code." };
  }
  if (coupon.status === "REDEEMED") {
    return { ok: false, error: "This coupon has already been redeemed." };
  }
  if (coupon.status === "VOIDED") {
    return { ok: false, error: "This coupon has been voided." };
  }

  // Enforce required face value if specified
  if (input.requiredPaise !== undefined && coupon.faceValue !== input.requiredPaise) {
    return { ok: false, error: `This action requires a coupon worth ₹${input.requiredPaise / 100}. This coupon is worth ₹${coupon.faceValue / 100}.` };
  }

  await prisma.coupon.update({
    where: { id: input.code.toUpperCase() },
    data: {
      status: "REDEEMED",
      redeemedAt: new Date(),
      redeemedBy: input.redeemedByUserId,
    },
  });

  await createAuditLog({
    adminId: input.redeemedByUserId,
    action: "COUPON_REDEEMED",
    metadata: { couponCode: input.code, faceValuePaise: coupon.faceValue },
  });

  return { ok: true, faceValuePaise: coupon.faceValue };
}

// ─────────────────────────────────────────────
// Void Coupon (Cashier — refund)
// ─────────────────────────────────────────────

export interface VoidCouponInput {
  code: string;
  cashierId: string;
  reason: string;
}

export type VoidResult =
  | { ok: true }
  | { ok: false; error: string };

export async function voidCoupon(input: VoidCouponInput): Promise<VoidResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { id: input.code.toUpperCase() },
  });

  if (!coupon) {
    return { ok: false, error: "Invalid coupon code." };
  }
  if (coupon.status === "REDEEMED") {
    return { ok: false, error: "Cannot void a redeemed coupon." };
  }
  if (coupon.status === "VOIDED") {
    return { ok: false, error: "This coupon is already voided." };
  }

  // Only the issuing cashier (or an admin) should be able to void —
  // enforced at the API layer; here we just perform the action.
  await prisma.coupon.update({
    where: { id: input.code.toUpperCase() },
    data: {
      status: "VOIDED",
      voidedAt: new Date(),
      voidReason: input.reason,
    },
  });

  await createAuditLog({
    adminId: input.cashierId,
    action: "COUPON_VOIDED",
    metadata: {
      couponCode: input.code,
      faceValuePaise: coupon.faceValue,
      reason: input.reason,
      buyerPhone: coupon.buyerPhone,
    },
  });

  return { ok: true };
}

// ─────────────────────────────────────────────
// Cashier Ledger
// ─────────────────────────────────────────────

export async function getCashierLedger(cashierId: string, eventId: string) {
  const coupons = await prisma.coupon.findMany({
    where: { cashierId, eventId },
    orderBy: { issuedAt: "desc" },
  });

  const totalIssued = coupons.filter((c) => c.status !== "VOIDED").length;
  const totalRedeemed = coupons.filter((c) => c.status === "REDEEMED").length;
  const totalVoided = coupons.filter((c) => c.status === "VOIDED").length;
  const cashCollected = coupons
    .filter((c) => c.status !== "VOIDED")
    .reduce((sum, c) => sum + c.faceValue, 0);
  const cashRefunded = coupons
    .filter((c) => c.status === "VOIDED")
    .reduce((sum, c) => sum + c.faceValue, 0);

  return {
    coupons,
    summary: {
      totalIssued,
      totalRedeemed,
      totalVoided,
      cashCollectedPaise: cashCollected,
      cashRefundedPaise: cashRefunded,
      netPaise: cashCollected - cashRefunded,
    },
  };
}
