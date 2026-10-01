import { NextRequest, NextResponse } from "next/server";
import { getSession, hasEventRole } from "@/lib/auth/session";
import { getActiveEvent } from "@/lib/event-service";
import { generateLeaderboard } from "@/lib/leaderboard-service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ error: "No active event" }, { status: 400 });

  const isAuthorized = await hasEventRole(session.userId, event.id, "ADMIN");
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow generating leaderboard if choices are locked or matching is running
  if (event.status !== "CHOOSING_CLOSED" && event.status !== "MATCHING" && event.status !== "RESULTS_OPEN") {
    return NextResponse.json(
      { error: "Leaderboard can only be generated after choosing is closed." },
      { status: 400 }
    );
  }

  const result = await generateLeaderboard(event.id, session.userId);
  return NextResponse.json(result);
}
