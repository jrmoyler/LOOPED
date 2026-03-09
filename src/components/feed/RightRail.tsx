"use client";

import { Heart, Share2, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface RightRailProps {
  gameId: string;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

export function RightRail({ gameId, isFavorited, onFavorite, onShare }: RightRailProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
        {/* Favorite */}
        <button
          className="flex flex-col items-center gap-1 group"
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isFavorited ? "bg-[#7B61FF]/20" : "bg-white/10"
            }`}
          >
            <Heart
              size={20}
              className={`transition-colors ${isFavorited ? "fill-[#7B61FF] text-[#7B61FF]" : "text-white"}`}
            />
          </div>
          <span className="text-[10px] text-[#9CA3AF]">{isFavorited ? "Saved" : "Save"}</span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1 group"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
        >
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <Share2 size={20} className="text-white" />
          </div>
          <span className="text-[10px] text-[#9CA3AF]">Share</span>
        </button>

        {/* More */}
        <button
          className="flex flex-col items-center gap-1 group"
          onClick={(e) => {
            e.stopPropagation();
            setShowMore(true);
          }}
        >
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <MoreHorizontal size={20} className="text-white" />
          </div>
          <span className="text-[10px] text-[#9CA3AF]">More</span>
        </button>
      </div>

      {/* More sheet */}
      {showMore && (
        <MoreSheet gameId={gameId} onClose={() => setShowMore(false)} />
      )}
    </>
  );
}

function MoreSheet({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-[#111111] rounded-t-3xl p-6 pb-10 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#4B5563] rounded-full mx-auto mb-6" />
        <h3 className="text-white font-700 text-lg mb-4">Game Options</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "Not interested", icon: "🚫" },
            { label: "Report", icon: "⚠️" },
            { label: "Game info", icon: "ℹ️" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 text-white py-3 px-4 rounded-xl bg-white/5 active:bg-white/10"
              onClick={onClose}
            >
              <span>{item.icon}</span>
              <span className="font-500">{item.label}</span>
            </button>
          ))}
        </div>
        <button
          className="w-full mt-4 py-3 rounded-xl text-[#9CA3AF] active:bg-white/5"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
