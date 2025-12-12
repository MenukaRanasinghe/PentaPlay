"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";

type AlgoRow = { name: string; minThrows: number; timeMs: number };

type NewGameResponse = {
  gameId: number;
  playerName: string;
  boardSize: number;
  choices: number[];
  algorithms: AlgoRow[];
  boardDebug?: { ladders: [number, number][]; snakes: [number, number][] };
};

type SubmitResponse = {
  gameId: number;
  playerName: string;
  choice: number;
  correct: number;
  outcome: "win" | "lose" | "draw";
};

const API_BASE = "http://localhost:5000/snake-ladder";

function buildDisplayCells(N: number): number[] {
  const total = N * N;
  const rows: number[][] = [];
  for (let r = 0; r < N; r++) {
    const start = total - r * N;
    const row = Array.from({ length: N }, (_, i) => start - i);
    rows.push(row);
  }
  for (let r = 0; r < N; r++) if (r % 2 === 1) rows[r].reverse();
  return rows.flat();
}

export default function SnakeLadderQuiz() {
  const [playerName, setPlayerName] = useState("");
  const [boardSize, setBoardSize] = useState<number>(6);
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const [ladders, setLadders] = useState<[number, number][]>([]);
  const [snakes, setSnakes] = useState<[number, number][]>([]);

  const total = boardSize * boardSize;
  const displayCells = useMemo(() => buildDisplayCells(boardSize), [boardSize]);

  const CELL = useMemo(() => {
    if (boardSize <= 7) return 58;
    if (boardSize <= 9) return 50;
    if (boardSize <= 10) return 46;
    return 40;
  }, [boardSize]);

  const ladderBottoms = useMemo(() => new Set(ladders.map(([b]) => b)), [ladders]);
  const ladderTops = useMemo(() => new Set(ladders.map(([, t]) => t)), [ladders]);
  const snakeHeads = useMemo(() => new Set(snakes.map(([h]) => h)), [snakes]);
  const snakeTails = useMemo(() => new Set(snakes.map(([, t]) => t)), [snakes]);

  const jumpTo = useMemo(() => {
    const m = new Map<number, { to: number; type: "ladder" | "snake" }>();
    for (const [b, t] of ladders) m.set(b, { to: t, type: "ladder" });
    for (const [h, t] of snakes) m.set(h, { to: t, type: "snake" });
    return m;
  }, [ladders, snakes]);

  async function startRound(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!playerName.trim()) return alert("Enter player name");

    try {
      setLoading(true);
      const res = await axios.post<NewGameResponse>(`${API_BASE}/new-game`, {
        playerName,
        boardSize,
      });

      setGameId(res.data.gameId);
      setChoices(res.data.choices);
      setAlgos(res.data.algorithms);

      setLadders(res.data.boardDebug?.ladders ?? []);
      setSnakes(res.data.boardDebug?.snakes ?? []);
    } catch (err: any) {
      console.error(err?.response?.data || err);
      alert(err?.response?.data?.detail || err?.response?.data?.error || "Server error");
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice(choice: number) {
    if (!gameId) return;

    try {
      setLoading(true);
      const res = await axios.post<SubmitResponse>(`${API_BASE}/submit`, {
        gameId,
        playerName,
        choice,
      });
      setResult(res.data);
    } catch (err: any) {
      console.error(err?.response?.data || err);
      alert(err?.response?.data?.detail || err?.response?.data?.error || "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen text-white"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-[140px]"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center tracking-wide">
              🐍 Snake & Ladder
            </h1>

            <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <form onSubmit={startRound} className="grid gap-4">
                  <input
                    className="rounded-lg p-3 bg-black/40 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Player Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />

                  <input
                    type="number"
                    min={6}
                    max={12}
                    value={boardSize}
                    onChange={(e) => setBoardSize(parseInt(e.target.value || "6", 10))}
                    className="rounded-lg p-3 bg-black/40 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-semibold shadow-lg"
                  >
                    {loading ? "Preparing..." : "Start Round"}
                  </button>
                </form>

                {choices.length > 0 && (
                  <div className="mt-6 text-center">
                    <h2 className="font-semibold mb-3 text-gray-200">
                      Choose the minimum number of dice throws to reach {total}
                    </h2>
                    <div className="flex justify-center gap-3 flex-wrap">
                      {choices.map((c) => (
                        <button
                          key={c}
                          onClick={() => submitChoice(c)}
                          disabled={loading}
                          className="w-24 py-3 rounded-xl bg-black/50 border border-white/20 hover:bg-black/70 transition font-semibold"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {algos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-center text-gray-200">
                      Algorithm Results (min throws + time)
                    </h3>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      {algos.map((a) => (
                        <div
                          key={a.name}
                          className="flex justify-between border-b border-white/10 last:border-none py-1 text-sm"
                        >
                          <span>{a.name}</span>
                          <span>
                            {a.minThrows} throws • {a.timeMs} ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <div
                    className={`mt-6 rounded-xl p-5 text-center font-semibold ${result.outcome === "win"
                        ? "bg-green-500/20 text-green-300"
                        : result.outcome === "draw"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                  >
                    <p>You chose: {result.choice}</p>
                    <p>Correct answer: {result.correct}</p>
                    <p className="mt-2 text-lg">
                      {result.outcome === "win" && "✅ You win!"}
                      {result.outcome === "draw" && "🟡 Draw (off by 1)"}
                      {result.outcome === "lose" && "❌ You lose"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <h2 className="font-semibold mb-3 text-center text-gray-200">
                  Board ({boardSize}×{boardSize})
                </h2>

                {!gameId ? (
                  <div className="text-center text-gray-300 py-16">
                    Start a round to generate a board.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div
                      className="grid gap-2 mx-auto w-max"
                      style={{ gridTemplateColumns: `repeat(${boardSize}, ${CELL}px)` }}
                    >
                      {displayCells.map((cell) => {
                        const jump = jumpTo.get(cell);

                        const ladderBottom = ladderBottoms.has(cell);
                        const ladderTop = ladderTops.has(cell);
                        const snakeHead = snakeHeads.has(cell);
                        const snakeTail = snakeTails.has(cell);

                        const ring =
                          ladderBottom
                            ? "ring-2 ring-emerald-400"
                            : snakeHead
                              ? "ring-2 ring-rose-400"
                              : ladderTop
                                ? "ring-2 ring-emerald-700/70 ring-dashed"
                                : snakeTail
                                  ? "ring-2 ring-rose-700/70 ring-dashed"
                                  : "";

                        return (
                          <div
                            key={cell}
                            style={{ width: CELL, height: CELL }}
                            className={[
                              "relative rounded-xl border border-white/10 bg-black/25",
                              "flex items-center justify-center",
                              ring,
                            ].join(" ")}
                            title={`Cell ${cell}${jump ? ` (${jump.type} to ${jump.to})` : ""}`}
                          >
                            <div className="absolute top-1 left-1 text-[10px] text-gray-300">
                              {cell}
                            </div>

                            {jump && (
                              <div
                                className={[
                                  "absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-md border",
                                  jump.type === "ladder"
                                    ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                                    : "bg-rose-500/15 text-rose-200 border-rose-500/30",
                                ].join(" ")}
                              >
                                {jump.type === "ladder"
                                  ? `🪜 ↑ ${jump.to}`
                                  : `🐍 ↓ ${jump.to}`}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
