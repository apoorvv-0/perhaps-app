import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch('https://roviara-web.vercel.app/api/admin/config', {
      headers: { Authorization: `Bearer ${process.env.INTER_APP_SECRET || ''}` }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
