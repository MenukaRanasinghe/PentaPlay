"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";

type Edge = { from: string; to: string; capacity: number };
type AlgoRow = { name: string; maxFlow: number; timeMs: number };

type NewGameResponse = {
  gameId: number;
  playerName: string;
  choices: number[];
  algorithms: AlgoRow[];
  edges: Edge[];
};

type SubmitResponse = {
  gameId: number;
  playerName: string;
  choice: number;
  correct: number;
  outcome: "win" | "lose" | "draw";
};

const API_BASE = "http://localhost:5000/traffic-simulation";

const NODE_POS: Record<string, { x: number; y: number }> = {
  A: { x: 60, y: 160 },

  B: { x: 180, y: 80 },
  C: { x: 180, y: 160 },
  D: { x: 180, y: 240 },

  E: { x: 330, y: 120 },
  F: { x: 330, y: 220 },

  G: { x: 470, y: 100 },
  H: { x: 470, y: 220 },

  T: { x: 610, y: 160 },
};

function Graph({ edges }: { edges: Edge[] }) {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/20 p-6">
      <svg
        viewBox="0 0 700 320"
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-auto"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L10,3 L0,6 Z" fill="white" />
          </marker>
        </defs>

        {edges.map((e, idx) => {
          const a = NODE_POS[e.from];
          const b = NODE_POS[e.to];

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;

          const t = 0.55;
          const lx = a.x + dx * t;
          const ly = a.y + dy * t;

          const offset = 6;
          const ox = (-dy / len) * offset;
          const oy = (dx / len) * offset;

          const tx = lx + ox;
          const ty = ly + oy;

          return (
            <g key={idx}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="white"
                strokeOpacity={0.55}
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                fontSize="12"
                fill="white"
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {e.capacity}
              </text>


            </g>
          );
        })}

        {Object.entries(NODE_POS).map(([node, p]) => (
          <g key={node}>
            <circle
              cx={p.x}
              cy={p.y}
              r={18}
              fill="rgba(0,0,0,0.7)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              fontSize="14"
              fill="white"
              fontWeight="700"
            >
              {node}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 text-center text-xs text-gray-300">
        Directed network A → T with random capacities (5–15)
      </div>
    </div>
  );
}


export default function TrafficSimulation() {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const title = useMemo(() => "🚦 Traffic Simulation Problem", []);

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!playerName.trim()) return alert("Enter player name");

    try {
      setLoading(true);
      const res = await axios.post<NewGameResponse>(`${API_BASE}/new-game`, {
        playerName,
      });

      setGameId(res.data.gameId);
      setChoices(res.data.choices);
      setEdges(res.data.edges);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.response?.data?.error || "Failed to start game");
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
      alert(err?.response?.data?.detail || err?.response?.data?.error || "Failed to submit");
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
              {title}
            </h1>

            <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <form onSubmit={startGame} className="grid gap-4">
                  <input
                    className="rounded-lg p-3 bg-black/40 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Player Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
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
                      Enter the maximum flow from A → T
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
                    <div className="mt-2 text-xs text-gray-400">
                      Draw rule: within ±2 of correct
                    </div>
                  </div>
                )}

                {algos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-center text-gray-200">
                      Algorithm Results (max flow + time)
                    </h3>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      {algos.map((a) => (
                        <div
                          key={a.name}
                          className="flex justify-between border-b border-white/10 last:border-none py-1 text-sm"
                        >
                          <span>{a.name}</span>
                          <span>
                            {a.maxFlow} • {a.timeMs} ms
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
                      {result.outcome === "draw" && "🟡 Draw"}
                      {result.outcome === "lose" && "❌ You lose"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <h2 className="font-semibold mb-3 text-center text-gray-200">
                  Traffic Network Graph
                </h2>

                {!gameId ? (
                  <div className="text-center text-gray-300 py-16">
                    Start a round to generate random capacities.
                  </div>
                ) : (
                  <Graph edges={edges} />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
