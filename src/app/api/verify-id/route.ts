import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { imageBase64, phone } = body;

    if (!imageBase64 || !phone) {
      return NextResponse.json({ error: "Missing image or phone number" }, { status: 400 });
    }

    // Update user to PENDING state and save the base64 image
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        idCardUrl: imageBase64,
        phone: phone,
        idVerificationStatus: "PENDING"
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("ID Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload ID" }, { status: 500 });
  }
}
