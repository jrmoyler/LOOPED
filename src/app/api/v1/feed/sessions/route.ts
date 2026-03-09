import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import type { GameCard } from "@/types";

function parseGame(game: {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  creatorName: string;
  status: string;
  primaryGenre: string;
  tags: string;
  sessionLengthSec: number;
  inputModes: string;
  orientation: string;
  contentRating: string;
  lanes: string;
  builds: {
    id: string;
    url: string;
    entry: string;
    allowedOrigin: string;
    featuresJson: string;
    sandboxOverride: string | null;
    allowOverride: string | null;
  }[];
}): GameCard {
  const build = game.builds[0];
  return {
    gameId: game.id,
    title: game.title,
    subtitle: game.subtitle,
    description: game.description,
    creatorName: game.creatorName,
    primaryGenre: game.primaryGenre as GameCard["primaryGenre"],
    tags: JSON.parse(game.tags),
    sessionLengthSec: game.sessionLengthSec,
    inputModes: JSON.parse(game.inputModes),
    orientation: game.orientation as GameCard["orientation"],
    contentRating: game.contentRating as GameCard["contentRating"],
    lanes: JSON.parse(game.lanes),
    build: build
      ? {
          buildId: build.id,
          url: build.url,
          entry: build.entry,
          allowedOrigin: build.allowedOrigin,
          features: JSON.parse(build.featuresJson),
          sandboxOverride: build.sandboxOverride ?? undefined,
          allowOverride: build.allowOverride ?? undefined,
        }
      : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = uuidv4();

    // Parse device info from headers/body
    const session = await prisma.feedSession.create({
      data: {
        id: sessionId,
        platform: body.platform ?? req.headers.get("sec-ch-ua-platform") ?? "",
        locale: body.locale ?? req.headers.get("accept-language")?.split(",")[0] ?? "",
        timezone: body.timezone ?? "",
        appVersion: "1.0.0",
        network: body.network ?? "",
      },
    });

    // Get main feed games (active, in main lane)
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
      take: 10,
    });

    const cards = games.map(parseGame);

    return NextResponse.json({
      session_id: session.id,
      cards,
      prefetch_hint: cards[1]?.build?.allowedOrigin ?? null,
    });
  } catch (error) {
    console.error("Feed session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
