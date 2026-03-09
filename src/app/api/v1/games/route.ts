import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "active";
    const lane = searchParams.get("lane");

    const games = await prisma.game.findMany({
      where: {
        status,
        ...(lane ? { lanes: { contains: lane } } : {}),
      },
      include: {
        builds: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { favorites: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error("Games list error:", error);
    return NextResponse.json({ error: "Failed to list games" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Admin only - handled in admin route
  return NextResponse.json({ error: "Use /admin API to create games" }, { status: 400 });
}
