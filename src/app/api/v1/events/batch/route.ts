import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface EventInput {
  sessionId: string;
  userId?: string;
  gameId?: string;
  event: string;
  payload?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: EventInput[] = body.events ?? [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }

    if (events.length > 200) {
      return NextResponse.json({ error: "Max 200 events per batch" }, { status: 400 });
    }

    // Validate all events have required fields
    for (const evt of events) {
      if (!evt.sessionId || !evt.event) {
        return NextResponse.json({ error: "Invalid event: missing sessionId or event" }, { status: 400 });
      }
    }

    await prisma.telemetryEvent.createMany({
      data: events.map((evt) => ({
        sessionId: evt.sessionId,
        userId: evt.userId ?? null,
        gameId: evt.gameId ?? null,
        event: evt.event,
        payload: JSON.stringify(evt.payload ?? {}),
      })),
    });

    return NextResponse.json({ ok: true, count: events.length });
  } catch (error) {
    console.error("Events batch error:", error);
    return NextResponse.json({ error: "Failed to ingest events" }, { status: 500 });
  }
}
