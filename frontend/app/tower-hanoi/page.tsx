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
      console.error(err);
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
      console.error(err);
      alert(
        err?.response?.data?.details ??
        err?.response?.data?.error ??
        "Failed to submit answer"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🗼 Tower of Hanoi</h1>

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

        <div>
          <p className="font-semibold mb-1">Select number of pegs</p>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="pegs"
                value={3}
                checked={pegs === 3}
                onChange={() => setPegs(3)}
              />
              3 Pegs (classic)
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="pegs"
                value={4}
                checked={pegs === 4}
                onChange={() => setPegs(4)}
              />
              4 Pegs (Frame–Stewart)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Preparing..." : "Start Round"}
        </button>
      </form>

      {disks && source && dest && (
        <section className="mb-4">
          <h2 className="font-semibold mb-1">🎮 Round Info</h2>
          <p>
            Disks: <b>{disks}</b> &nbsp;|&nbsp; Pegs:{" "}
            <b>{pegs}</b>
          </p>
          <p>
            Source peg: <b>{source}</b> &nbsp;→ Destination peg:{" "}
            <b>{dest}</b>
          </p>
          <p className="text-sm text-gray-600">
            Rules: move one disk at a time, never place a larger disk on a smaller one.
          </p>
        </section>
      )}

      {choices.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">
            🔢 Choose the minimum number of moves
          </h3>
          <div className="flex gap-3 mb-3">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => submitAnswer(c)}
                disabled={loading}
                className="border rounded px-4 py-2 hover:bg-gray-100"
              >
                {c} moves
              </button>
            ))}
          </div>

          <div>
            <p className="font-semibold mb-1 text-sm">
              Sequence of moves (optional, for assignment description)
            </p>
            <textarea
              className="border p-2 w-[420px] h-24 text-sm"
              placeholder={`Example format:\nA->D, A->B, B->D, ...`}
              value={sequenceText}
              onChange={(e) => setSequenceText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only the number of moves is checked for correctness, but your
              sequence is saved in the database when you win.
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
                  moves: <b>{a.moves}</b> • time: <b>{a.timeMs} ms</b>
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
            You guessed: <b>{result.movesGuess} moves</b>
          </p>
          <p>
            Correct minimum moves: <b>{result.correctMoves}</b>
          </p>
          <p className="mt-2 text-sm">
            Example optimal sequence (first moves):{" "}
            <b>{result.optimalSequence.slice(0, 10).join(", ")}{result.optimalSequence.length > 10 ? ", ..." : ""}</b>
          </p>

          <p
            className={`mt-3 font-bold ${result.outcome === "win"
                ? "text-green-700"
                : result.outcome === "draw"
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}
          >
            {result.outcome === "win" && "✅ You win!"}
            {result.outcome === "draw" && "🟡 Draw (close!)"}
            {result.outcome === "lose" && "❌ You lose"}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            (Only wins are saved with your name, number of moves and sequences in the database.)
          </p>
        </section>
      )}
    </main>
  );
}
