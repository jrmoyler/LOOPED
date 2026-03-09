"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LoopedGlyph } from "@/components/ui/Logo";

interface AuthModalProps {
  onDismiss: () => void;
  onComplete: () => void;
}

export function AuthModal({ onDismiss, onComplete }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
    setTimeout(onComplete, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111111] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 pb-10 sm:pb-6">
        {/* Dismiss handle */}
        <div className="flex items-center justify-between mb-6">
          <LoopedGlyph size={32} />
          <button
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            onClick={onDismiss}
          >
            <X size={14} className="text-[#9CA3AF]" />
          </button>
        </div>

        {!sent ? (
          <>
            <h2 className="text-white font-700 text-xl mb-1">You&apos;re already LOOPED.</h2>
            <p className="text-[#9CA3AF] text-sm mb-6">
              Save favorites, track streaks, and keep your picks.
            </p>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] outline-none focus:border-[#7B61FF] transition-colors mb-3"
            />

            <button
              className="w-full py-3 rounded-full bg-[#7B61FF] text-white font-700 active:scale-95 transition-all disabled:opacity-50"
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending..." : "Continue with Email"}
            </button>

            <button
              className="w-full py-3 text-[#9CA3AF] text-sm mt-2 active:text-white"
              onClick={onDismiss}
            >
              Maybe later
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-white font-700 text-lg mb-1">Check your email</h3>
            <p className="text-[#9CA3AF] text-sm">
              We sent a magic link to <strong className="text-white">{email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
