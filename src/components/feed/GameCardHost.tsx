"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { GameCard, LoopedMessage, GameEndPayload } from "@/types";
import { EndSummaryOverlay } from "./EndSummaryOverlay";
import { RightRail } from "./RightRail";

interface GameCardHostProps {
  card: GameCard;
  sessionId: string;
  isActive: boolean;
  isFavorited?: boolean;
  onGameEnd?: (payload: GameEndPayload, gameId: string) => void;
  onFavorite?: (gameId: string) => void;
  onShare?: (gameId: string) => void;
  onSwipeNext?: () => void;
}

export function GameCardHost({
  card,
  sessionId,
  isActive,
  isFavorited = false,
  onGameEnd,
  onFavorite,
  onShare,
  onSwipeNext,
}: GameCardHostProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const destroyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [gameState, setGameState] = useState<"loading" | "ready" | "playing" | "ended">("loading");
  const [endPayload, setEndPayload] = useState<GameEndPayload | null>(null);
  const [iframeError, setIframeError] = useState(false);

  const sendMessage = useCallback(
    (type: LoopedMessage["type"], payload?: Record<string, unknown>) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !card.build) return;

      const msg: LoopedMessage = {
        lo: "looped",
        v: 1,
        type,
        session_id: sessionId,
        game_id: card.gameId,
        payload,
      };

      try {
        iframe.contentWindow.postMessage(msg, card.build.allowedOrigin);
      } catch (e) {
        console.warn("[LOOPED] postMessage failed:", e);
      }
    },
    [card, sessionId]
  );

  const handleGameEnd = useCallback(
    (payload: GameEndPayload) => {
      if (destroyTimerRef.current) {
        clearTimeout(destroyTimerRef.current);
        destroyTimerRef.current = null;
      }
      setEndPayload(payload);
      setGameState("ended");
      onGameEnd?.(payload, card.gameId);

      // Track telemetry
      fetch("/api/v1/events/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [
            {
              sessionId,
              gameId: card.gameId,
              event: payload.rage_quit ? "game_rage_quit" : "game_end",
              payload,
            },
          ],
        }),
      }).catch(() => {});
    },
    [card.gameId, onGameEnd, sessionId]
  );

  // Listen for messages from game
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as LoopedMessage;
      if (!msg || msg.lo !== "looped" || msg.v !== 1) return;
      if (msg.game_id !== card.gameId) return;

      // Validate origin
      if (card.build && event.origin !== card.build.allowedOrigin) {
        console.warn(`[LOOPED] Invalid origin: ${event.origin}`);
        return;
      }

      switch (msg.type) {
        case "GAME_READY":
          setGameState("ready");
          if (isActive) sendMessage("LOOPED_INIT");
          break;
        case "GAME_START":
          setGameState("playing");
          startTimeRef.current = Date.now();
          break;
        case "GAME_END": {
          const p = msg.payload as unknown as GameEndPayload;
          if (typeof p?.duration_ms !== "number") {
            console.warn("[LOOPED] Invalid GAME_END payload");
            return;
          }
          handleGameEnd(p);
          break;
        }
        case "GAME_ERROR":
          setIframeError(true);
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [card, isActive, sendMessage, handleGameEnd]);

  // Active state management
  useEffect(() => {
    if (isActive) {
      if (gameState === "ready") {
        sendMessage("LOOPED_INIT");
      } else if (gameState === "playing") {
        sendMessage("LOOPED_RESUME");
      }
    } else {
      if (gameState === "playing") {
        sendMessage("LOOPED_PAUSE");
      }
    }
  }, [isActive, gameState, sendMessage]);

  // Force-exit: synthesize GAME_END if not received within 200ms
  const forceExit = useCallback(() => {
    sendMessage("LOOPED_PAUSE");
    sendMessage("LOOPED_DESTROY");

    destroyTimerRef.current = setTimeout(() => {
      if (gameState !== "ended") {
        const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        handleGameEnd({
          duration_ms: duration,
          completed: false,
          rage_quit: true,
        });
      }
    }, 200);
  }, [sendMessage, gameState, handleGameEnd]);

  // Expose forceExit via ref-like mechanism on the element
  useEffect(() => {
    const el = document.getElementById(`game-card-${card.gameId}`);
    if (el) {
      (el as HTMLElement & { forceExit?: () => void }).forceExit = forceExit;
    }
  }, [card.gameId, forceExit]);

  const buildUrl = card.build
    ? `${card.build.url}?session_id=${sessionId}&game_id=${card.gameId}`
    : null;

  const sandboxAttr =
    card.build?.sandboxOverride ?? "allow-scripts allow-pointer-lock allow-forms allow-same-origin";
  const allowAttr = card.build?.allowOverride ?? "autoplay";

  return (
    <div
      id={`game-card-${card.gameId}`}
      className="absolute inset-0 bg-[#0B0B0B] flex flex-col"
    >
      {/* Iframe */}
      {buildUrl && !iframeError ? (
        <iframe
          ref={iframeRef}
          src={buildUrl}
          sandbox={sandboxAttr}
          allow={allowAttr}
          className="w-full flex-1 border-none"
          title={card.title}
          onLoad={() => {
            // If game never sends GAME_READY, we still init
            setTimeout(() => {
              if (gameState === "loading" && isActive) {
                sendMessage("LOOPED_INIT");
                setGameState("ready");
              }
            }, 2000);
          }}
          onError={() => setIframeError(true)}
        />
      ) : (
        <PlaceholderGame
          card={card}
          onStart={() => {
            setGameState("playing");
            startTimeRef.current = Date.now();
          }}
          onEnd={(score) => {
            const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 5000;
            handleGameEnd({ score, duration_ms: duration, completed: true });
          }}
        />
      )}

      {/* Right Rail */}
      {gameState !== "ended" && (
        <RightRail
          gameId={card.gameId}
          isFavorited={isFavorited}
          onFavorite={() => onFavorite?.(card.gameId)}
          onShare={() => onShare?.(card.gameId)}
        />
      )}

      {/* End Summary */}
      {gameState === "ended" && endPayload && (
        <EndSummaryOverlay
          card={card}
          payload={endPayload}
          isFavorited={isFavorited}
          onFavorite={() => onFavorite?.(card.gameId)}
          onShare={() => onShare?.(card.gameId)}
          onSwipeNext={onSwipeNext}
        />
      )}

      {/* Loading state */}
      {gameState === "loading" && !iframeError && buildUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B0B0B] pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#7B61FF] border-t-transparent animate-spin" />
            <span className="text-[#9CA3AF] text-sm font-medium">Loading {card.title}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder game when no real build URL is set
function PlaceholderGame({
  card,
  onStart,
  onEnd,
}: {
  card: GameCard;
  onStart: () => void;
  onEnd: (score?: number) => void;
}) {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const genreColors: Record<string, string> = {
    arcade: "#7B61FF",
    puzzle: "#10B981",
    learn: "#3B82F6",
    create: "#F59E0B",
    tool: "#6B7280",
  };
  const color = genreColors[card.primaryGenre] ?? "#7B61FF";

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onEnd(score);
          return 0;
        }
        return t - 1;
      });
      // Simulate score increment
      setScore((s) => s + Math.floor(Math.random() * 10));
    }, 1000);
    return () => clearInterval(interval);
  }, [started, onEnd, score]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 select-none">
      {/* Genre badge */}
      <div
        className="px-3 py-1 rounded-full text-xs font-500 uppercase tracking-wider"
        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {card.primaryGenre}
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{card.title}</h2>
        <p className="text-[#9CA3AF] text-sm">{card.subtitle}</p>
      </div>

      {!started ? (
        <>
          <p className="text-[#9CA3AF] text-sm text-center max-w-xs">{card.description}</p>
          <button
            className="mt-4 px-10 py-4 rounded-full font-700 text-white text-lg transition-all active:scale-95"
            style={{ backgroundColor: color }}
            onClick={() => {
              setStarted(true);
              onStart();
            }}
          >
            Play Now
          </button>
          <p className="text-[#4B5563] text-xs">Demo placeholder — real game loads here</p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Score */}
          <div className="text-6xl font-700 text-white">{score}</div>
          <div className="text-[#9CA3AF] text-sm">points</div>

          {/* Time left */}
          <div className="w-full bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(timeLeft / 30) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <div className="text-[#9CA3AF] text-xs">{timeLeft}s remaining</div>

          {/* Tap area */}
          <button
            className="w-40 h-40 rounded-full border-2 flex items-center justify-center text-4xl active:scale-95 transition-transform mt-4"
            style={{ borderColor: color, backgroundColor: `${color}15` }}
            onClick={() => setScore((s) => s + 50 + Math.floor(Math.random() * 50))}
          >
            👆
          </button>
          <p className="text-[#4B5563] text-sm">Tap to score!</p>
        </div>
      )}
    </div>
  );
}
