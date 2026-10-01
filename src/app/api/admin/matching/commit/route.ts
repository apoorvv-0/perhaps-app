import { NextRequest, NextResponse } from "next/server";
import { POST_COMMIT } from "@/lib/matching/matching-handlers";

export async function POST(request: NextRequest) {
  return POST_COMMIT(request);
}
