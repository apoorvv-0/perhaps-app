import { NextRequest } from "next/server";
import { voidHandler } from "@/lib/cashier-handlers";
export async function POST(req: NextRequest) { return voidHandler(req); }
