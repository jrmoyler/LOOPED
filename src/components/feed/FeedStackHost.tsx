"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GameCard } from "@/types";
import { GameCardHost } from "./GameCardHost";
import { AuthModal } from "./AuthModal";
import { LoopedLogo } from "@/components/ui/Logo";
import { ChevronUp } from "lucide-react";

interface FeedStackHostProps {
  initialCards: GameCard[];
  sessionId: string;
}

const SWIPE_THRESHOLD = 50; // px
const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms
const TRANSITION_MS = 240;
const AUTH_PROMPT_AFTER = 4; // games played before showing auth

export function FeedStackHost({ initialCards, sessionId }: FeedStackHostProps) {
  const [cards, setCards] = useState<GameCard[]>(initialCards);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAuth, setShowAuth] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load more cards when near end
  const loadMore = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/feed/sessions/${sessionId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursor: cards.length }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cards?.length) {
          setCards((c) => [...c, ...data.cards]);
        }
      }
    } catch (e) {
      console.warn("Failed to load more cards:", e);
    }
  }, [sessionId, cards.length]);

  useEffect(() => {
    if (activeIndex >= cards.length - 2) {
      loadMore();
    }
  }, [activeIndex, cards.length, loadMore]);

  // Hide swipe hint after first interaction
  useEffect(() => {
    if (gamesPlayed > 0) setShowSwipeHint(false);
  }, [gamesPlayed]);

  // Auto-hide header
  const resetHeaderTimer = useCallback(() => {
    setHeaderVisible(true);
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHeaderTimer();
    return () => {
      if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    };
  }, [resetHeaderTimer]);

  const goToNext = useCallback(() => {
    if (transitioning || activeIndex >= cards.length - 1) return;
    setDirection("next");
    setTransitioning(true);
    setGamesPlayed((n) => n + 1);
    setTimeout(() => {
      setActiveIndex((i) => i + 1);
      setTransitioning(false);
    }, TRANSITION_MS);

    // Auth prompt
    if (gamesPlayed + 1 >= AUTH_PROMPT_AFTER && !showAuth) {
      setTimeout(() => setShowAuth(true), 300);
    }

    resetHeaderTimer();
  }, [transitioning, activeIndex, cards.length, gamesPlayed, showAuth, resetHeaderTimer]);

  const goToPrev = useCallback(() => {
    if (transitioning || activeIndex <= 0) return;
    setDirection("prev");
    setTransitioning(true);
    setTimeout(() => {
      setActiveIndex((i) => i - 1);
      setTransitioning(false);
    }, TRANSITION_MS);
    resetHeaderTimer();
  }, [transitioning, activeIndex, resetHeaderTimer]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null || touchStartTime.current === null) return;

      const dy = touchStartY.current - e.changedTouches[0].clientY;
      const dt = Date.now() - touchStartTime.current;
      const velocity = Math.abs(dy) / dt;

      if (dy > SWIPE_THRESHOLD || (dy > 20 && velocity > SWIPE_VELOCITY_THRESHOLD)) {
        goToNext();
      } else if (dy < -SWIPE_THRESHOLD || (dy < -20 && velocity > SWIPE_VELOCITY_THRESHOLD)) {
        goToPrev();
      }

      touchStartY.current = null;
      touchStartTime.current = null;
    },
    [goToNext, goToPrev]
  );

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goToNext();
      if (e.key === "ArrowUp" || e.key === "k") goToPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToNext, goToPrev]);

  const handleFavorite = useCallback(
    async (gameId: string) => {
      const isFav = favorites.has(gameId);
      setFavorites((f) => {
        const next = new Set(f);
        if (isFav) next.delete(gameId);
        else next.add(gameId);
        return next;
      });

      try {
        if (isFav) {
          await fetch(`/api/v1/me/favorites/${gameId}`, { method: "DELETE" });
        } else {
          await fetch("/api/v1/me/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId }),
          });
        }
      } catch (e) {
        console.warn("Favorite failed:", e);
      }
    },
    [favorites]
  );

  const handleShare = useCallback((gameId: string) => {
    const url = `${window.location.origin}?game=${gameId}`;
    if (navigator.share) {
      navigator.share({ title: "Check this game on LOOPED", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, []);

  // 3-card window: render prev, current, next
  const windowCards = [
    activeIndex > 0 ? cards[activeIndex - 1] : null,
    cards[activeIndex] ?? null,
    cards[activeIndex + 1] ?? null,
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0B0B0B] overflow-hidden touch-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 3-card stack */}
      <div className="absolute inset-0">
        {windowCards.map((card, windowIdx) => {
          if (!card) return null;
          const offset = (windowIdx - 1) * 100; // -100%, 0%, +100%
          // During transition, shift all cards in the swipe direction so they animate
          const directionShift = transitioning ? (direction === "next" ? -100 : 100) : 0;
          const translateY = offset + directionShift;

          return (
            <div
              key={card.gameId}
              className="absolute inset-0"
              style={{
                transform: `translateY(${translateY}%)`,
                transition: transitioning
                  ? `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                  : "none",
                zIndex: windowIdx === 1 ? 10 : 5,
              }}
            >
              <GameCardHost
                card={card}
                sessionId={sessionId}
                isActive={windowIdx === 1}
                isFavorited={favorites.has(card.gameId)}
                onGameEnd={() => {}}
                onFavorite={handleFavorite}
                onShare={handleShare}
                onSwipeNext={goToNext}
              />
            </div>
          );
        })}
      </div>

      {/* Header - auto-hide */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 transition-all duration-300"
        style={{
          paddingTop: `max(12px, env(safe-area-inset-top))`,
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
          background: "linear-gradient(to bottom, rgba(11,11,11,0.9) 0%, transparent 100%)",
        }}
      >
        <LoopedLogo size="sm" />
        <div className="flex items-center gap-2">
          <span className="text-[#9CA3AF] text-xs">
            {activeIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Swipe hint */}
      {showSwipeHint && activeIndex === 0 && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1 z-20 pointer-events-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="swipe-hint flex flex-col items-center">
            <ChevronUp size={18} className="text-[#7B61FF]" />
            <ChevronUp size={18} className="text-[#7B61FF] -mt-2 opacity-50" />
          </div>
          <span className="text-[#9CA3AF] text-xs">Swipe up for next</span>
        </div>
      )}

      {/* Progress dots */}
      <div className="absolute bottom-20 right-3 flex flex-col gap-1 z-20">
        {Array.from({ length: Math.min(cards.length, 8) }, (_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-300"
            style={{
              height: i === activeIndex ? 16 : 4,
              backgroundColor: i === activeIndex ? "#7B61FF" : "#4B5563",
            }}
          />
        ))}
      </div>

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          onDismiss={() => setShowAuth(false)}
          onComplete={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
