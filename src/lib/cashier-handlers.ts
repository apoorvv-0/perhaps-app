/**
 * POST /api/cashier/coupons/issue   — Issue a new coupon
 * POST /api/cashier/coupons/void    — Void (refund) a coupon  
 * GET  /api/cashier/ledger          — View cashier's own ledger
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, hasEventRole } from "@/lib/auth/session";
import { issueCoupon, voidCoupon, getCashierLedger } from "@/lib/coupon-service";
import { getActiveEvent } from "@/lib/event-service";
import { z } from "zod";

// ─────────────────────────────────────────────
// POST /api/cashier/coupons/issue
// ─────────────────────────────────────────────

const issueSchema = z.object({
  faceValueRupees: z
    .number()
    .positive()
    .max(10000, "Face value cannot exceed ₹10,000"),
  buyerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export async function issueHandler(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ error: "No active event" }, { status: 400 });

  const isCashier = await hasEventRole(session.userId, event.id, "CASHIER");
  if (!isCashier && session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = issueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const coupon = await issueCoupon({
    cashierId: session.userId,
    faceValueRupees: parsed.data.faceValueRupees,
    buyerPhone: parsed.data.buyerPhone,
    eventId: event.id,
  });

  return NextResponse.json({
    ok: true,
    code: coupon.id,
    faceValueRupees: parsed.data.faceValueRupees,
    buyerPhone: parsed.data.buyerPhone,
    issuedAt: coupon.issuedAt,
    note: "Refundable within 14 days after Results close.",
  });
}

// ─────────────────────────────────────────────
// POST /api/cashier/coupons/void
// ─────────────────────────────────────────────

const voidSchema = z.object({
  code: z.string().min(1).max(20),
  reason: z.string().min(5, "Please provide a reason for voiding (min 5 chars)"),
});

export async function voidHandler(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ error: "No active event" }, { status: 400 });

  const isCashier = await hasEventRole(session.userId, event.id, "CASHIER");
  if (!isCashier && session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = voidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const result = await voidCoupon({
    code: parsed.data.code,
    cashierId: session.userId,
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─────────────────────────────────────────────
// GET /api/cashier/ledger
// ─────────────────────────────────────────────

export async function ledgerHandler() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ error: "No active event" }, { status: 400 });

  const isCashier = await hasEventRole(session.userId, event.id, "CASHIER");
  if (!isCashier && session.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ledger is currently scoped by cashierId and eventId
  const ledger = await getCashierLedger(session.userId, event.id);

  return NextResponse.json({
    ...ledger,
    summary: {
      ...ledger.summary,
      cashCollectedRupees: ledger.summary.cashCollectedPaise / 100,
      cashRefundedRupees: ledger.summary.cashRefundedPaise / 100,
      netRupees: ledger.summary.netPaise / 100,
    },
  });
}
