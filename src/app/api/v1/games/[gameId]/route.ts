import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        builds: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { favorites: true, telemetry: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Game fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}
