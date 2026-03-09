"use client";

import { FeedStackHost } from "@/components/feed/FeedStackHost";
import type { GameCard } from "@/types";

interface FeedClientProps {
  initialCards: GameCard[];
  sessionId: string;
}

export function FeedClient({ initialCards, sessionId }: FeedClientProps) {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0B0B0B]">
      <FeedStackHost initialCards={initialCards} sessionId={sessionId} />
    </main>
  );
}
