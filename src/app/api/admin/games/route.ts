import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.cookies.get("admin_token")?.value;
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    include: {
      builds: { orderBy: { createdAt: "desc" } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ games });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const game = await prisma.game.create({
      data: {
        id: body.id,
        title: body.title,
        subtitle: body.subtitle ?? "",
        description: body.description ?? "",
        creatorName: body.creatorName ?? "LOOPED",
        status: body.status ?? "draft",
        primaryGenre: body.primaryGenre ?? "arcade",
        tags: JSON.stringify(body.tags ?? []),
        sessionLengthSec: body.sessionLengthSec ?? 60,
        inputModes: JSON.stringify(body.inputModes ?? ["tap"]),
        orientation: body.orientation ?? "portrait",
        contentRating: body.contentRating ?? "E",
        lanes: JSON.stringify(body.lanes ?? []),
      },
    });

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}
