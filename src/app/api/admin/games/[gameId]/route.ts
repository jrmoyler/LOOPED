import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.cookies.get("admin_token")?.value;
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { builds: { orderBy: { createdAt: "desc" } } },
  });

  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ game });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.primaryGenre !== undefined) updateData.primaryGenre = body.primaryGenre;
  if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
  if (body.inputModes !== undefined) updateData.inputModes = JSON.stringify(body.inputModes);
  if (body.lanes !== undefined) updateData.lanes = JSON.stringify(body.lanes);
  if (body.sessionLengthSec !== undefined) updateData.sessionLengthSec = body.sessionLengthSec;
  if (body.orientation !== undefined) updateData.orientation = body.orientation;

  const game = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
  });

  return NextResponse.json({ game });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gameId } = await params;
  await prisma.game.update({
    where: { id: gameId },
    data: { status: "deprecated" },
  });

  return NextResponse.json({ ok: true });
}
