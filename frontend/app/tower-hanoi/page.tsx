"use client";

import { useState } from "react";
import axios from "axios";

type AlgoRow = {
  name: string;
  moves: number;
  timeMs: number;
};

export default function TowerOfHanoiPage() {
  const [playerName, setPlayerName] = useState("");
  const [pegs, setPegs] = useState<3 | 4>(3);
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [disks, setDisks] = useState<number | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [pegLabels, setPegLabels] = useState<string[]>([]);

  const [choices, setChoices] = useState<number[]>([]);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);
  const [sequenceText, setSequenceText] = useState("");

  const [result, setResult] = useState<null | {
    outcome: "win" | "lose" | "draw";
    movesGuess: number;
    correctMoves: number;
    optimalSequence: string[];
  }>(null);

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setChoices([]);
    setAlgos([]);
    setSequenceText("");

    if (!playerName.trim()) {
      alert("Please enter player name");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/tower-hanoi/new-game", {
        playerName,
        pegs,
      });

      setGameId(res.data.gameId);
      setDisks(res.data.disks);
      setSource(res.data.source);
      setDest(res.data.dest);
      setPegLabels(res.data.pegLabels || []);
      setChoices(res.data.choices);
      setAlgos(res.data.algorithms || []);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to start Hanoi game");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(movesGuess: number) {
    if (!gameId) return;

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/tower-hanoi/submit", {
        gameId,
        playerName,
        movesGuess,
        sequenceText,
      });

      setResult({
        outcome: res.data.outcome,
        movesGuess: res.data.movesGuess,
        correctMoves: res.data.correctMoves,
        optimalSequence: res.data.optimalSequence,
      });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to submit answer");
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
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center tracking-wide">
              🗼 Tower of Hanoi Challenge
            </h1>

            <section className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <form onSubmit={startGame} className="grid gap-4">
                  <input
                    className="rounded-lg p-3 bg-black/40 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Player Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />

                  <div>
                    <p className="font-semibold mb-2 text-gray-200">
                      Select number of pegs
                    </p>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={pegs === 3}
                          onChange={() => setPegs(3)}
                        />
                        3 Pegs
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={pegs === 4}
                          onChange={() => setPegs(4)}
                        />
                        4 Pegs
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-semibold shadow-lg"
                  >
                    {loading ? "Preparing..." : "Start Round"}
                  </button>
                </form>

                {choices.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-center text-gray-200">
                      Guess the minimum moves
                    </h3>

                    <div className="flex flex-wrap justify-center gap-3">
                      {choices.map((c) => (
                        <button
                          key={c}
                          onClick={() => submitAnswer(c)}
                          disabled={loading}
                          className="w-24 py-3 rounded-xl bg-black/50 border border-white/20 hover:bg-black/70 transition font-semibold"
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="mt-4 w-full rounded-lg p-3 bg-black/40 border border-white/20 text-sm text-white placeholder-gray-400"
                      placeholder="Optional move sequence (A->B, A->C, ...)"
                      value={sequenceText}
                      onChange={(e) => setSequenceText(e.target.value)}
                    />
                  </div>
                )}

                {algos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-center text-gray-200">
                      Algorithm Results
                    </h3>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30 text-sm">
                      {algos.map((a) => (
                        <div
                          key={a.name}
                          className="flex justify-between border-b border-white/10 last:border-none py-1"
                        >
                          <span>{a.name}</span>
                          <span>
                            {a.moves} • {a.timeMs} ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <div
                    className={`mt-6 rounded-xl p-5 text-center font-semibold ${
                      result.outcome === "win"
                        ? "bg-green-500/20 text-green-300"
                        : result.outcome === "draw"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    <p>You guessed: {result.movesGuess}</p>
                    <p>Correct moves: {result.correctMoves}</p>
                    <p className="mt-2 text-lg">
                      {result.outcome === "win" && "✅ You win!"}
                      {result.outcome === "draw" && "🟡 Draw"}
                      {result.outcome === "lose" && "❌ You lose"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-6">
                <h2 className="font-semibold mb-4 text-center text-gray-200">
                  Game Information
                </h2>

                {!disks ? (
                  <div className="text-center text-gray-400 py-16">
                    Start a round to generate the puzzle.
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-gray-300">
                    <p>
                      Disks: <b className="text-white">{disks}</b>
                    </p>
                    <p>
                      Pegs: <b className="text-white">{pegs}</b>
                    </p>
                    <p>
                      Source → Destination:{" "}
                      <b className="text-white">
                        {source} → {dest}
                      </b>
                    </p>
                    <p className="text-xs text-gray-400">
                      Rules: Move one disk at a time. Never place a larger disk on a smaller one.
                    </p>
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
