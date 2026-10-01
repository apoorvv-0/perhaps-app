import { NextRequest, NextResponse } from "next/server";
import { POST_DRY_RUN } from "@/lib/matching/matching-handlers";

export async function POST(request: NextRequest) {
  return POST_DRY_RUN(request);
}
