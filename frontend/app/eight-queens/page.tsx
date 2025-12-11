"use client";

import { useState } from "react";
import axios from "axios";

type AlgoRow = {
  name: string;
  totalSolutions: number;
  timeMs: number;
};

export default function EightQueensPage() {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);
  const [solutionPattern, setSolutionPattern] = useState("");

  const [result, setResult] = useState<null | {
    choice: number;
    correctTotal: number;
    outcome: "win" | "lose" | "draw";
    solutionStatus: string;
    allRecognised: boolean;
  }>(null);

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setChoices([]);
    setAlgos([]);
    setSolutionPattern("");

    if (!playerName.trim()) {
      alert("Please enter player name");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/eight-queens/new-game",
        { playerName }
      );
      setGameId(res.data.gameId);
      setChoices(res.data.choices || []);
      setAlgos(res.data.algorithms || []);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Failed to start Eight Queens game");
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice(choice: number) {
    if (!gameId) return;

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/eight-queens/submit",
        {
          gameId,
          playerName,
          choice,
          solutionPattern,
        }
      );
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  function renderSolutionStatus(status: string, allRecognised: boolean) {
    if (status === "invalid") {
      return (
        <p className="text-sm text-red-700 mt-2">
          ❌ The entered queen pattern is not a valid Eight Queens solution.
        </p>
      );
    }
    if (status === "already_recognised") {
      return (
        <p className="text-sm text-yellow-700 mt-2">
          ⚠️ This valid solution has already been recognised in the current
          cycle. Try a different one!
        </p>
      );
    }
    if (status === "new") {
      return (
        <p className="text-sm text-green-700 mt-2">
          ✅ New valid Eight Queens solution recognised for this cycle!
        </p>
      );
    }
    if (allRecognised) {
      return (
        <p className="text-sm text-blue-700 mt-2">
          🎉 All distinct solutions have been recognised for this cycle. A new
          cycle will start with future players.
        </p>
      );
    }
    return null;
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">♕ Eight Queens Puzzle</h1>

      <form
        onSubmit={startGame}
        className="space-y-4 mb-8 border p-4 rounded w-[420px] bg-gray-50"
      >
        <div>
          <label className="block font-semibold mb-1">Player Name</label>
          <input
            className="border p-2 w-full"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>

        <p className="text-sm text-gray-700">
          The goal is to place 8 queens on a standard 8×8 chessboard so that no
          two queens attack each other. Your task is to guess the{" "}
          <b>maximum number of distinct solutions</b>.
        </p>

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
          <h3 className="font-semibold mb-2">
            🔢 Choose the total number of distinct Eight Queens solutions
          </h3>
          <div className="flex gap-3 mb-4">
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

          <div>
            <p className="font-semibold mb-1 text-sm">
              Optional: provide one concrete Eight Queens solution
            </p>
            <textarea
              className="border p-2 w-[420px] h-24 text-sm"
              placeholder={`Enter 8 numbers for queen columns by row.\nEither 1–8 or 0–7, e.g.:\n1,5,8,6,3,7,2,4  or  0,4,7,5,2,6,1,3`}
              value={solutionPattern}
              onChange={(e) => setSolutionPattern(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              If your pattern is a valid and previously unrecognised solution,
              it will be recorded separately (assignment requirement).
            </p>
          </div>
        </section>
      )}

      {algos.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">⏱ Algorithm timings</h3>
          <div className="border rounded p-3 w-[420px] text-sm">
            {algos.map((a) => (
              <div key={a.name} className="flex justify-between mb-1">
                <span>{a.name}</span>
                <span>
                  total solutions: <b>{a.totalSolutions}</b> • time:{" "}
                  <b>{a.timeMs} ms</b>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="border rounded p-4 w-[420px] bg-gray-50">
          <h3 className="font-semibold mb-2">Result</h3>
          <p>
            You guessed: <b>{result.choice}</b>
          </p>
          <p>
            Correct number of solutions: <b>{result.correctTotal}</b>
          </p>

          <p
            className={`mt-3 font-bold ${
              result.outcome === "win"
                ? "text-green-700"
                : result.outcome === "draw"
                ? "text-yellow-700"
                : "text-red-700"
            }`}
          >
            {result.outcome === "win" && "✅ You win!"}
            {result.outcome === "draw" && "🟡 Draw (close guess!)"}
            {result.outcome === "lose" && "❌ You lose"}
          </p>

          {renderSolutionStatus(
            result.solutionStatus,
            result.allRecognised
          )}

          <p className="text-xs text-gray-500 mt-2">
            Only correct numeric answers are stored in{" "}
            <code>correct_answers</code>. Valid and unique solutions are tracked
            in <code>queens_solution_claims</code> per cycle.
          </p>
        </section>
      )}
    </main>
  );
}
