import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, userId } = body;

    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    // For now, use anonymous user if no userId
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const user = await prisma.user.create({
        data: { authProvider: "anonymous", isAnonymous: true },
      });
      resolvedUserId = user.id;
    }

    const favorite = await prisma.favorite.upsert({
      where: { userId_gameId: { userId: resolvedUserId, gameId } },
      update: {},
      create: { userId: resolvedUserId, gameId },
    });

    return NextResponse.json({ favorite, userId: resolvedUserId });
  } catch (error) {
    console.error("Favorite error:", error);
    return NextResponse.json({ error: "Failed to favorite" }, { status: 500 });
  }
}
