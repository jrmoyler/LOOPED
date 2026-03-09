import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.cookies.get("admin_token")?.value;
  return token === process.env.ADMIN_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const build = await prisma.gameBuild.create({
      data: {
        gameId: body.gameId,
        version: body.version ?? "1.0.0",
        url: body.url,
        entry: body.entry ?? "index.html",
        allowedOrigin: body.allowedOrigin,
        featuresJson: JSON.stringify(body.features ?? {}),
        sandboxOverride: body.sandboxOverride ?? null,
        allowOverride: body.allowOverride ?? null,
        integritySha256: body.integritySha256 ?? null,
        minClientVersion: body.minClientVersion ?? null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ build });
  } catch (error) {
    console.error("Create build error:", error);
    return NextResponse.json({ error: "Failed to create build" }, { status: 500 });
  }
}
