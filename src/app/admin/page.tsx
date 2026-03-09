"use client";

import { useState, useEffect } from "react";
import { LoopedLogo } from "@/components/ui/Logo";
import {
  Plus, Edit2, Trash2, ExternalLink, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Save, X
} from "lucide-react";

interface Game {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  primaryGenre: string;
  tags: string;
  lanes: string;
  sessionLengthSec: number;
  builds: Build[];
}

interface Build {
  id: string;
  version: string;
  url: string;
  allowedOrigin: string;
  isActive: boolean;
}

const LANES = ["main", "learn", "tools", "creative"];
const GENRES = ["arcade", "puzzle", "learn", "create", "tool"];
const STATUSES = ["draft", "active", "paused", "deprecated"];

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [showNewGame, setShowNewGame] = useState(false);
  const [error, setError] = useState("");

  const headers = { "x-admin-token": token, "Content-Type": "application/json" };

  async function loadGames() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/games", { headers });
      if (res.status === 401) { setError("Invalid token"); setAuthed(false); return; }
      const data = await res.json();
      setGames(data.games ?? []);
    } catch {
      setError("Failed to load games");
    }
    setLoading(false);
  }

  async function login() {
    setError("");
    const res = await fetch("/api/admin/games", { headers: { "x-admin-token": token } });
    if (res.status === 401) { setError("Wrong password"); return; }
    setAuthed(true);
    loadGames();
  }

  async function toggleStatus(game: Game) {
    const newStatus = game.status === "active" ? "paused" : "active";
    await fetch(`/api/admin/games/${game.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: newStatus }),
    });
    loadGames();
  }

  async function saveGame(data: Partial<Game> & { id: string }) {
    const isNew = !games.find((g) => g.id === data.id);
    if (isNew) {
      await fetch("/api/admin/games", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...data,
          tags: JSON.parse(typeof data.tags === "string" ? data.tags : "[]"),
          lanes: JSON.parse(typeof data.lanes === "string" ? data.lanes : "[]"),
        }),
      });
    } else {
      await fetch(`/api/admin/games/${data.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          ...data,
          tags: JSON.parse(typeof data.tags === "string" ? data.tags : "[]"),
          lanes: JSON.parse(typeof data.lanes === "string" ? data.lanes : "[]"),
        }),
      });
    }
    setEditGame(null);
    setShowNewGame(false);
    loadGames();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <LoopedLogo size="md" className="mb-8" />
          <h1 className="text-white text-2xl font-700 mb-2">Admin</h1>
          <p className="text-[#9CA3AF] text-sm mb-6">Enter your admin password</p>
          {error && <p className="text-[#EF4444] text-sm mb-4">{error}</p>}
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Admin token"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] outline-none focus:border-[#7B61FF] mb-3"
          />
          <button
            onClick={login}
            className="w-full py-3 bg-[#7B61FF] text-white font-700 rounded-full active:scale-95 transition-all"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LoopedLogo size="sm" />
          <span className="text-[#9CA3AF] text-sm">Admin</span>
        </div>
        <a href="/insights" className="text-[#7B61FF] text-sm flex items-center gap-1 hover:opacity-80">
          Insights <ExternalLink size={12} />
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-700">Games</h1>
          <button
            onClick={() => setShowNewGame(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7B61FF] text-white rounded-full text-sm font-500 active:scale-95 transition-all"
          >
            <Plus size={14} /> New Game
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#7B61FF] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Games table */}
        <div className="space-y-3">
          {games.map((game) => (
            <GameRow
              key={game.id}
              game={game}
              onEdit={() => setEditGame(game)}
              onToggle={() => toggleStatus(game)}
            />
          ))}
        </div>
      </div>

      {/* Edit/Create modal */}
      {(editGame || showNewGame) && (
        <GameEditModal
          game={editGame ?? undefined}
          onSave={saveGame}
          onClose={() => { setEditGame(null); setShowNewGame(false); }}
        />
      )}
    </div>
  );
}

function GameRow({
  game,
  onEdit,
  onToggle,
}: {
  game: Game;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<string, string> = {
    active: "text-green-400",
    paused: "text-yellow-400",
    draft: "text-[#9CA3AF]",
    deprecated: "text-[#EF4444]",
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Status toggle */}
        <button onClick={onToggle} className="flex-shrink-0">
          {game.status === "active" ? (
            <ToggleRight size={24} className="text-[#7B61FF]" />
          ) : (
            <ToggleLeft size={24} className="text-[#4B5563]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-700 text-white">{game.title}</span>
            <span className={`text-xs ${statusColors[game.status] ?? "text-[#9CA3AF]"}`}>
              {game.status}
            </span>
          </div>
          <div className="text-[#9CA3AF] text-sm truncate">{game.id} · {game.primaryGenre}</div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
          {(JSON.parse(game.lanes) as string[]).map((l) => (
            <span key={l} className="px-2 py-0.5 bg-white/10 rounded-full">{l}</span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-white/10 pt-3">
          <p className="text-[#9CA3AF] text-sm mb-3">{game.description || "No description"}</p>
          <div className="text-xs text-[#4B5563]">
            <span className="font-500 text-[#9CA3AF]">Builds:</span>{" "}
            {game.builds.length > 0
              ? game.builds.map((b) => (
                  <span key={b.id} className="ml-2">
                    v{b.version} — <a href={b.url} target="_blank" rel="noreferrer" className="text-[#7B61FF] hover:underline">{b.url.slice(0, 40)}...</a>
                    {b.isActive ? " ✓" : " (inactive)"}
                  </span>
                ))
              : " No builds yet"}
          </div>
        </div>
      )}
    </div>
  );
}

function GameEditModal({
  game,
  onSave,
  onClose,
}: {
  game?: Game;
  onSave: (data: Partial<Game> & { id: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: game?.id ?? "",
    title: game?.title ?? "",
    subtitle: game?.subtitle ?? "",
    description: game?.description ?? "",
    status: game?.status ?? "draft",
    primaryGenre: game?.primaryGenre ?? "arcade",
    tags: game?.tags ?? "[]",
    lanes: game?.lanes ?? "[]",
    sessionLengthSec: game?.sessionLengthSec ?? 60,
  });

  const selectedLanes: string[] = JSON.parse(form.lanes);
  const toggleLane = (lane: string) => {
    const current = JSON.parse(form.lanes) as string[];
    const next = current.includes(lane) ? current.filter((l) => l !== lane) : [...current, lane];
    setForm((f) => ({ ...f, lanes: JSON.stringify(next) }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111111] rounded-3xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-700 text-xl">{game ? "Edit Game" : "New Game"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Game ID (slug)" disabled={!!game}>
            <input
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
              disabled={!!game}
              className="input-field"
              placeholder="my_game_slug"
            />
          </Field>

          <Field label="Title">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field" />
          </Field>

          <Field label="Subtitle">
            <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className="input-field" />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field h-20 resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Genre">
              <select value={form.primaryGenre} onChange={(e) => setForm((f) => ({ ...f, primaryGenre: e.target.value }))} className="input-field">
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>

            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input-field">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Lanes">
            <div className="flex gap-2 flex-wrap">
              {LANES.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => toggleLane(lane)}
                  className={`px-3 py-1.5 rounded-full text-sm font-500 transition-all ${
                    selectedLanes.includes(lane)
                      ? "bg-[#7B61FF] text-white"
                      : "bg-white/10 text-[#9CA3AF]"
                  }`}
                >
                  {lane}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Session Length (sec)">
            <input
              type="number"
              value={form.sessionLengthSec}
              onChange={(e) => setForm((f) => ({ ...f, sessionLengthSec: Number(e.target.value) }))}
              className="input-field"
            />
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-white/20 rounded-full text-white font-500">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-3 bg-[#7B61FF] rounded-full text-white font-700 flex items-center justify-center gap-2"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 14px;
          color: white;
          outline: none;
          font-family: inherit;
        }
        .input-field:focus {
          border-color: #7B61FF;
        }
        .input-field option {
          background: #111;
        }
        .input-field:disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <div>
      <label className={`block text-xs font-500 mb-1.5 ${disabled ? "text-[#4B5563]" : "text-[#9CA3AF]"}`}>
        {label}
      </label>
      {children}
    </div>
  );
}
