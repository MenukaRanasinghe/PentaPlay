"use client";

import React, { useState } from "react";
import axios from "axios";

type AlgoRow = {
  name: string;
  totalSolutions: number;
  timeMs: number;
};

type Feedback = {
  status: "correct" | "invalid" | "already_recognised" | "error";
  message: string;
  found?: number;
  total?: number;
};

const API_BASE = "http://localhost:5000/eight-queens";

export default function EightQueensPage() {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);

  const [queens, setQueens] = useState<number[]>(Array(8).fill(-1));
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return alert("Enter player name");

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/new-game`, { playerName });

      setGameId(res.data.gameId);
      setAlgos(res.data.algorithms || []);

      setQueens(Array(8).fill(-1));
      setFeedback(null);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to start game");
    } finally {
      setLoading(false);
    }
  }

  function handleCellClick(row: number, col: number) {
    if (!gameId) return;

    setQueens((prev) => {
      const newQueens = [...prev];
      if (newQueens[row] === col) {
        newQueens[row] = -1;
      } else {
        newQueens[row] = col;
      }
      return newQueens;
    });

    if (feedback?.status !== 'correct') setFeedback(null);
  }

  async function submitSolution() {
    if (!gameId) return;

    if (queens.includes(-1)) {
      setFeedback({
        status: "error",
        message: "Incomplete! Place 8 Queens (one per row)."
      });
      return;
    }

    try {
      setLoading(true);

      const patternString = queens.map(c => c + 1).join(",");

      const res = await axios.post(`${API_BASE}/submit`, {
        gameId,
        playerName,
        solutionPattern: patternString,
      });

      const { status, message, found, total } = res.data;

      setFeedback({ status, message, found, total });

      if (status === "correct") {
        setTimeout(() => {
          setQueens(Array(8).fill(-1));
          setFeedback((prev) => prev ? { ...prev, message: "Board Cleared! Find the next one." } : null);
        }, 1500);
      }

    } catch (err: any) {
      alert("Error submitting solution");
    } finally {
      setLoading(false);
    }
  }

  function renderBoard() {
    return (
      <div className="overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4">
        <div
          className="grid gap-2 mx-auto w-max"
          style={{ gridTemplateColumns: `repeat(8, 50px)` }}
        >
          {Array.from({ length: 64 }).map((_, idx) => {
            const row = Math.floor(idx / 8);
            const col = idx % 8;
            const isDark = (row + col) % 2 === 1;
            const isSelected = queens[row] === col;

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(row, col)}
                disabled={!gameId}
                style={{ width: 50, height: 50 }}
                className={`
                    relative rounded-xl border border-white/10 flex items-center justify-center transition-all
                    ${!gameId ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 active:scale-95"}
                    ${isSelected
                    ? "bg-blue-600/40 ring-2 ring-blue-400 z-10 text-2xl"
                    : isDark ? "bg-white/5" : "bg-black/25"
                  }
                `}
              >
                {isSelected && "♕"}
                <span className="absolute top-0.5 left-1 text-[8px] text-gray-500 opacity-50">
                  {row + 1},{col + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
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
              ♕ Eight Queens
            </h1>

            <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <form onSubmit={startGame} className="grid gap-4">
                  <input
                    className="rounded-lg p-3 bg-black/40 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Player Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    disabled={loading || gameId !== null}
                  />

                  <button
                    type="submit"
                    disabled={loading || gameId !== null}
                    className={`h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all font-semibold shadow-lg ${gameId ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    {loading ? "Preparing..." : gameId ? "Game Active" : "Start Game"}
                  </button>
                </form>

                {algos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 text-center text-gray-200">
                      Algorithm Results
                    </h3>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      {algos.map((a) => (
                        <div
                          key={a.name}
                          className="flex justify-between border-b border-white/10 last:border-none py-1 text-sm"
                        >
                          <span className="text-gray-300">{a.name.replace(" (Worker Threads)", "")}</span>
                          <span className="font-mono text-purple-300">
                            {a.timeMs} ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 text-xs text-gray-400 text-center bg-white/5 rounded-xl border border-white/5">
                  Tip: Place 8 Queens so that no two queens share the same row, column, or diagonal.
                </div>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                <div className="w-full max-w-[400px] mb-6">
                  <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-wide">
                    Board Area
                  </h2>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-inner backdrop-blur-sm">
                    <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                      <span className="text-xl"></span> How to Play
                    </h3>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">✓</span>
                        <span>
                          Place exactly <strong>8 Queens</strong> on the board.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">✕</span>
                        <span>
                          <strong>No sharing columns:</strong> Only 1 Queen per vertical line.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">✕</span>
                        <span>
                          <strong>No sharing diagonals:</strong> Queens cannot touch diagonally.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {!gameId ? (
                  <div className="text-center text-gray-300 py-16">
                    Start a game to generate the board.
                  </div>
                ) : (
                  <>
                    {renderBoard()}

                    <button
                      onClick={submitSolution}
                      disabled={loading || !gameId}
                      className="mt-6 w-full max-w-[420px] h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Checking..." : "Submit Solution"}
                    </button>

                    {feedback && (
                      <div className={`mt-6 w-full max-w-[420px] rounded-xl p-5 text-center font-semibold border ${feedback.status === 'correct' ? "bg-green-500/20 border-green-500/30 text-green-300" :
                        feedback.status === 'already_recognised' ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-300" :
                          "bg-red-500/20 border-red-500/30 text-red-300"
                        }`}>
                        <div className="text-lg mb-1">
                          {feedback.status === "correct" && "✅ Correct!"}
                          {feedback.status === "already_recognised" && "⚠️ Duplicate!"}
                          {(feedback.status === "invalid" || feedback.status === "error") && "❌ Incorrect"}
                        </div>
                        <p className="text-sm font-normal opacity-90">{feedback.message}</p>

                        {feedback.found !== undefined && (
                          <p className="mt-2 text-xs opacity-70 font-mono pt-2 border-t border-white/10">
                            Progress: {feedback.found} / {feedback.total} found
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}