import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { redeemCoupon } from "@/lib/coupon-service";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.idVerificationStatus === "APPROVED" || !session.profileComplete) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getActiveEvent();
  if (!event || event.status !== "CHOOSING_OPEN") {
    return NextResponse.json(
      { error: "Choosing phase is not currently open." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
  }

  const { code } = parsed.data;
  const userId = session.userId;

  // Attempt to redeem the coupon (it checks if it exists, is ISSUED, and belongs to this event)
  // Wait, redeemCoupon currently takes requiredPaise?
  // We need to bypass requiredPaise or just let redeemCoupon redeem whatever face value it has.
  // Let's check the coupon first to get its faceValue.
  const coupon = await prisma.coupon.findUnique({ where: { id: code } });
  if (!coupon || coupon.eventId !== event.id || coupon.status !== "ISSUED") {
    return NextResponse.json({ error: "Invalid, expired, or used coupon code." }, { status: 400 });
  }

  const redeemResult = await redeemCoupon({
    code,
    redeemedByUserId: userId,
    requiredPaise: coupon.faceValue, // It just matches itself
  });

  if (!redeemResult.ok) {
    return NextResponse.json({ error: redeemResult.error }, { status: 400 });
  }

  // Calculate new max choices
  const coupons = await prisma.coupon.findMany({
    where: { redeemedBy: userId, eventId: event.id, status: 'REDEEMED' }
  });
  const totalSpent = coupons.reduce((acc, c) => acc + c.faceValue, 0);
  let maxChoicesAllowed = 3;
  if (totalSpent >= 21600) maxChoicesAllowed = 15;
  else if (totalSpent >= 16700) maxChoicesAllowed = 12;
  else if (totalSpent >= 11800) maxChoicesAllowed = 9;
  else if (totalSpent >= 6900) maxChoicesAllowed = 6;

  return NextResponse.json({ ok: true, maxChoicesAllowed });
}
