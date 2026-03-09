"use client";

import { useState, useEffect } from "react";
import { LoopedLogo } from "@/components/ui/Logo";
import { TrendingUp, Heart, Clock, Zap, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GameStat {
  gameId: string;
  title: string;
  status: string;
  primaryGenre: string;
  impressions: number;
  starts: number;
  ends: number;
  avgDurationMs: number;
  rageQuitRate: number;
  favoritesCount: number;
}

export default function InsightsPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setError("");
    const res = await fetch("/api/insights", {
      headers: { "x-admin-token": token },
    });
    if (res.status === 401) { setError("Wrong password"); return; }
    const data = await res.json();
    setStats(data.stats ?? []);
    setAuthed(true);
  }

  async function loadStats() {
    setLoading(true);
    const res = await fetch("/api/insights", { headers: { "x-admin-token": token } });
    const data = await res.json();
    setStats(data.stats ?? []);
    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <LoopedLogo size="md" className="mb-8" />
          <h1 className="text-white text-2xl font-700 mb-2">Insights</h1>
          <p className="text-[#9CA3AF] text-sm mb-6">Internal analytics dashboard</p>
          {error && <p className="text-[#EF4444] text-sm mb-4">{error}</p>}
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Admin token"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] outline-none focus:border-[#7B61FF] mb-3"
          />
          <button onClick={login} className="w-full py-3 bg-[#7B61FF] text-white font-700 rounded-full">
            View Insights
          </button>
        </div>
      </div>
    );
  }

  const totalStarts = stats.reduce((s, g) => s + g.starts, 0);
  const totalFavs = stats.reduce((s, g) => s + g.favoritesCount, 0);
  const avgDuration = stats.length
    ? Math.round(stats.reduce((s, g) => s + g.avgDurationMs, 0) / stats.length)
    : 0;
  const avgRageQuit = stats.length
    ? Math.round(stats.reduce((s, g) => s + g.rageQuitRate, 0) / stats.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-[#9CA3AF] hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <LoopedLogo size="sm" />
        <span className="text-[#9CA3AF] text-sm">Insights</span>
        <button onClick={loadStats} className="ml-auto text-xs text-[#7B61FF] hover:opacity-80">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<TrendingUp size={16} />} label="Total Starts" value={totalStarts.toLocaleString()} />
          <StatCard icon={<Heart size={16} />} label="Favorites" value={totalFavs.toLocaleString()} />
          <StatCard icon={<Clock size={16} />} label="Avg Duration" value={`${(avgDuration / 1000).toFixed(1)}s`} />
          <StatCard icon={<AlertTriangle size={16} />} label="Avg Rage Quit" value={`${avgRageQuit}%`} accent={avgRageQuit > 50} />
        </div>

        {/* Per-game table */}
        <h2 className="text-lg font-700 mb-4">Per-game stats</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[#9CA3AF] text-xs">
                <th className="text-left py-3 pr-4">Game</th>
                <th className="text-right py-3 px-3">Impressions</th>
                <th className="text-right py-3 px-3">Starts</th>
                <th className="text-right py-3 px-3">Ends</th>
                <th className="text-right py-3 px-3">Avg Duration</th>
                <th className="text-right py-3 px-3">Rage Quit</th>
                <th className="text-right py-3 pl-3">Favorites</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((g) => (
                <tr key={g.gameId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-500 text-white">{g.title}</div>
                    <div className="text-[#9CA3AF] text-xs">{g.primaryGenre} · {g.status}</div>
                  </td>
                  <td className="text-right py-3 px-3 text-[#9CA3AF]">{g.impressions}</td>
                  <td className="text-right py-3 px-3">{g.starts}</td>
                  <td className="text-right py-3 px-3">{g.ends}</td>
                  <td className="text-right py-3 px-3 text-[#9CA3AF]">
                    {g.avgDurationMs > 0 ? `${(g.avgDurationMs / 1000).toFixed(1)}s` : "—"}
                  </td>
                  <td className={`text-right py-3 px-3 ${g.rageQuitRate > 60 ? "text-[#EF4444]" : g.rageQuitRate > 30 ? "text-yellow-400" : "text-[#9CA3AF]"}`}>
                    {g.rageQuitRate}%
                  </td>
                  <td className="text-right py-3 pl-3">
                    <span className="flex items-center justify-end gap-1">
                      <Heart size={10} className="text-[#7B61FF]" />
                      {g.favoritesCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stats.length === 0 && !loading && (
            <div className="text-center py-16 text-[#4B5563]">
              <Zap size={32} className="mx-auto mb-3 opacity-40" />
              <p>No data yet. Play some games!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className={`mb-2 ${accent ? "text-[#EF4444]" : "text-[#7B61FF]"}`}>{icon}</div>
      <div className={`text-2xl font-700 ${accent ? "text-[#EF4444]" : "text-white"}`}>{value}</div>
      <div className="text-[#9CA3AF] text-xs mt-0.5">{label}</div>
    </div>
  );
}
