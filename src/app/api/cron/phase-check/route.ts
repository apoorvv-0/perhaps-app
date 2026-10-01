/**
 * GET /api/cron/phase-check
 *
 * Called by Vercel Cron every minute to auto-transition timed phases.
 * Secured by CRON_SECRET header.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/phase-check", "schedule": "* * * * *" }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { runPhaseTransitionCheck } from "@/lib/event-service";

export async function GET(request: NextRequest) {
  // Validate cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runPhaseTransitionCheck();
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[Cron] Phase check failed:", error);
    return NextResponse.json({ error: "Phase check failed" }, { status: 500 });
  }
}
