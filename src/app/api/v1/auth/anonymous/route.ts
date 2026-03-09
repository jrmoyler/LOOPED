import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await prisma.user.create({
      data: {
        authProvider: "anonymous",
        isAnonymous: true,
      },
    });

    return NextResponse.json({
      userId: user.id,
      token: `anon_${user.id}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Anon auth error:", error);
    return NextResponse.json({ error: "Failed to create anonymous user" }, { status: 500 });
  }
}
