import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  console.log('[DEBUG] /api/auth/me session:', session); return NextResponse.json({ session });
}
