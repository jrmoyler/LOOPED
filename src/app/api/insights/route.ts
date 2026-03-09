import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.cookies.get("admin_token")?.value;
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const games = await prisma.game.findMany({
      where: { status: { not: "deprecated" } },
      include: {
        _count: { select: { favorites: true } },
      },
    });

    const stats = await Promise.all(
      games.map(async (game) => {
        const events = await prisma.telemetryEvent.findMany({
          where: { gameId: game.id },
          select: { event: true, payload: true },
        });

        const impressions = events.filter((e) => e.event === "game_impression").length;
        const starts = events.filter((e) => e.event === "game_start" || e.event === "GAME_START").length;
        const ends = events.filter((e) => e.event === "game_end" || e.event === "GAME_END").length;
        const rageQuits = events.filter((e) => e.event === "game_rage_quit").length;

        const durations = events
          .filter((e) => e.event === "game_end" || e.event === "game_rage_quit")
          .map((e) => {
            try {
              const p = JSON.parse(e.payload);
              return p.duration_ms ?? 0;
            } catch {
              return 0;
            }
          })
          .filter((d) => d > 0);

        const avgDuration = durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

        const rageQuitRate = ends + rageQuits > 0 ? Math.round((rageQuits / (ends + rageQuits)) * 100) : 0;

        return {
          gameId: game.id,
          title: game.title,
          status: game.status,
          primaryGenre: game.primaryGenre,
          impressions,
          starts,
          ends,
          avgDurationMs: avgDuration,
          rageQuitRate,
          favoritesCount: game._count.favorites,
        };
      })
    );

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
