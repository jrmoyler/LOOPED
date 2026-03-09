"use client";

import { Heart, Share2, RefreshCw, ChevronUp } from "lucide-react";
import type { GameCard, GameEndPayload } from "@/types";

interface EndSummaryProps {
  card: GameCard;
  payload: GameEndPayload;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
  onSwipeNext?: () => void;
}

export function EndSummaryOverlay({
  card,
  payload,
  isFavorited,
  onFavorite,
  onShare,
  onSwipeNext,
}: EndSummaryProps) {
  const durationSec = Math.round(payload.duration_ms / 1000);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0B0B]/95 backdrop-blur-sm px-6">
      {/* Status */}
      <div className="mb-2">
        {payload.rage_quit ? (
          <span className="text-[#9CA3AF] text-sm">You left early</span>
        ) : (
          <span className="text-[#7B61FF] text-sm font-500">Game Complete</span>
        )}
      </div>

      {/* Score */}
      {payload.score !== undefined && (
        <div className="text-6xl font-700 text-white mb-1">{payload.score.toLocaleString()}</div>
      )}
      <div className="text-[#9CA3AF] text-sm mb-6">
        {durationSec}s played • {card.title}
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mb-8">
        <StatPill label="Time" value={`${durationSec}s`} />
        {payload.score !== undefined && (
          <StatPill label="Score" value={payload.score.toLocaleString()} />
        )}
        <StatPill
          label="Status"
          value={payload.completed ? "Complete" : "Quit"}
          highlight={payload.completed}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-xs mb-6">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-500 transition-all active:scale-95 ${
            isFavorited
              ? "bg-[#7B61FF] text-white"
              : "border border-white/20 text-white"
          }`}
          onClick={onFavorite}
        >
          <Heart size={16} className={isFavorited ? "fill-white" : ""} />
          {isFavorited ? "Saved" : "Save"}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-white/20 text-white font-500 active:scale-95 transition-all"
          onClick={onShare}
        >
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Swipe next CTA */}
      <button
        className="flex flex-col items-center gap-2 mt-2 active:opacity-70"
        onClick={onSwipeNext}
      >
        <div className="flex flex-col items-center swipe-hint">
          <ChevronUp size={20} className="text-[#7B61FF]" />
          <ChevronUp size={20} className="text-[#7B61FF] -mt-3 opacity-60" />
        </div>
        <span className="text-[#9CA3AF] text-sm font-500">Swipe for next</span>
      </button>
    </div>
  );
}

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`text-base font-700 ${highlight ? "text-[#7B61FF]" : "text-white"}`}
      >
        {value}
      </div>
      <div className="text-[#9CA3AF] text-xs">{label}</div>
    </div>
  );
}
