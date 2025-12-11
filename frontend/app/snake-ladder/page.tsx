"use client";

import { useState } from "react";
import axios from "axios";

type AlgoRow = { name: string; minThrows: number; timeMs: number };

export default function SnakeLadder() {
  const [playerName, setPlayerName] = useState("");
  const [boardSize, setBoardSize] = useState<number>(6);
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);
  const [result, setResult] = useState<null | {
    outcome: "win" | "lose" | "draw";
    correct: number;
    choice: number;
  }>(null);

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!playerName.trim()) {
      alert("Please enter player name");
      return;
    }
    if (boardSize < 6 || boardSize > 12) {
      alert("Board size must be 6..12");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/snake-ladder/new-game", {
        playerName,
        boardSize,
      });
      setGameId(res.data.gameId);
      setChoices(res.data.choices);
      setAlgos(res.data.algorithms);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to start game");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice(choice: number) {
    if (!gameId) return;
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/snake-ladder/submit", {
        gameId,
        playerName,
        choice,
      });
      setResult({
        outcome: res.data.outcome,
        correct: res.data.correct,
        choice: res.data.choice,
      });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to submit answer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🐍 Snake &amp; Ladder</h1>

      <form onSubmit={startGame} className="space-y-3 mb-6">
        <input
          className="border p-2 block w-72"
          placeholder="Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
        />
        <input
          className="border p-2 block w-72"
          type="number"
          min={6}
          max={12}
          value={boardSize}
          onChange={(e) => setBoardSize(parseInt(e.target.value))}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Preparing..." : "Start Round"}
        </button>
      </form>

      {choices.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">
            🔢 Choose the minimum number of dice throws to reach the last cell
          </h2>
          <div className="flex gap-3">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => submitChoice(c)}
                disabled={loading}
                className="border rounded px-4 py-2 hover:bg-gray-100"
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {algos.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">⏱️ Algorithm timings (recorded)</h3>
          <div className="border rounded p-3 w-[420px]">
            {algos.map((a) => (
              <div key={a.name} className="flex justify-between">
                <span>{a.name}</span>
                <span>
                  min throws: <b>{a.minThrows}</b> • time: <b>{a.timeMs} ms</b>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="border rounded p-4 w-[420px] bg-gray-50">
          <h3 className="font-semibold mb-2">Result</h3>
          <p className="mb-1">
            You chose: <b>{result.choice}</b>
          </p>
          <p className="mb-1">
            Correct answer: <b>{result.correct}</b>
          </p>
          <p className={`mt-2 font-bold ${
            result.outcome === "win"
              ? "text-green-700"
              : result.outcome === "draw"
              ? "text-yellow-700"
              : "text-red-700"
          }`}>
            {result.outcome === "win" && "✅ You win!"}
            {result.outcome === "draw" && "🟡 Draw (very close!)"}
            {result.outcome === "lose" && "❌ You lose"}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            (Only wins are saved with your name, as required.)
          </p>
        </section>
      )}
    </main>
  );
}
