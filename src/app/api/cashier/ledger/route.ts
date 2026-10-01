import { ledgerHandler } from "@/lib/cashier-handlers";
export async function GET() { return ledgerHandler(); }
