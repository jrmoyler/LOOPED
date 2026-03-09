import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const cursor = Number(body.cursor ?? 0);

    const session = await prisma.feedSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const games = await prisma.game.findMany({
      where: {
        status: "active",
        lanes: { contains: "main" },
      },
      include: {
        builds: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      skip: cursor,
      take: 5,
    });

    const cards = games.map((game) => ({
      gameId: game.id,
      title: game.title,
      subtitle: game.subtitle,
      description: game.description,
      creatorName: game.creatorName,
      primaryGenre: game.primaryGenre,
      tags: JSON.parse(game.tags),
      sessionLengthSec: game.sessionLengthSec,
      inputModes: JSON.parse(game.inputModes),
      orientation: game.orientation,
      contentRating: game.contentRating,
      lanes: JSON.parse(game.lanes),
      build: game.builds[0]
        ? {
            buildId: game.builds[0].id,
            url: game.builds[0].url,
            entry: game.builds[0].entry,
            allowedOrigin: game.builds[0].allowedOrigin,
            features: JSON.parse(game.builds[0].featuresJson),
          }
        : null,
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Next cards error:", error);
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 });
  }
}
