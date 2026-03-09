export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { FeedClient } from "./FeedClient";
import type { GameCard } from "@/types";

async function getInitialCards(): Promise<{ cards: GameCard[]; sessionId: string }> {
  try {
    const { v4: uuidv4 } = await import("uuid");
    const sessionId = uuidv4();

    const session = await prisma.feedSession.create({
      data: {
        id: sessionId,
        locale: "en-US",
        appVersion: "1.0.0",
      },
    });

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

    const cards: GameCard[] = games.map((game) => ({
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
      build: game.builds[0]
        ? {
            buildId: game.builds[0].id,
            url: game.builds[0].url,
            entry: game.builds[0].entry,
            allowedOrigin: game.builds[0].allowedOrigin,
            features: JSON.parse(game.builds[0].featuresJson),
            sandboxOverride: game.builds[0].sandboxOverride ?? undefined,
            allowOverride: game.builds[0].allowOverride ?? undefined,
          }
        : null,
    }));

    return { cards, sessionId: session.id };
  } catch (error) {
    console.error("Failed to load feed:", error);
    // Fallback cards for cold start
    return {
      cards: [
        {
          gameId: "slithercow",
          title: "SlitherCow",
          subtitle: "Snake, but make it bovine",
          description: "Classic snake gameplay with a chaotic cow skin and power-ups.",
          creatorName: "LOOPED",
          primaryGenre: "arcade",
          tags: ["snake", "arcade", "casual"],
          sessionLengthSec: 90,
          inputModes: ["swipe", "tap"],
          orientation: "portrait",
          contentRating: "E",
          lanes: ["main"],
          build: null,
        },
        {
          gameId: "word_puzzle",
          title: "Word Puzzle",
          subtitle: "Find the hidden word",
          description: "Wordle-inspired puzzle where you guess the mystery word in 6 tries.",
          creatorName: "LOOPED",
          primaryGenre: "puzzle",
          tags: ["word", "puzzle"],
          sessionLengthSec: 120,
          inputModes: ["tap"],
          orientation: "portrait",
          contentRating: "E",
          lanes: ["main"],
          build: null,
        },
      ],
      sessionId: "fallback-session",
    };
  }
}

export default async function FeedPage() {
  const { cards, sessionId } = await getInitialCards();

  return <FeedClient initialCards={cards} sessionId={sessionId} />;
}
