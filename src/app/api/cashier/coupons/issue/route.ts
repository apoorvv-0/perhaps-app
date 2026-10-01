import { NextRequest } from "next/server";
import { issueHandler } from "@/lib/cashier-handlers";
export async function POST(req: NextRequest) { return issueHandler(req); }
