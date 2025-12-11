"use client";

import { useState } from "react";
import axios from "axios";

export default function TrafficSimulation() {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [algos, setAlgos] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return alert("Enter player name");
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/traffic-simulation/new-game",
        { playerName }
      );
      setGameId(res.data.gameId);
      setChoices(res.data.choices);
      setAlgos(res.data.algorithms);
      setEdges(res.data.edges);
      setResult(null);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to start game");
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice(choice: number) {
    if (!gameId) return;
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/traffic-simulation/submit", // ✅ fixed URL
        { gameId, playerName, choice }
      );
      setResult(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🚦 Traffic Simulation Problem</h1>

      <form onSubmit={startGame} className="space-y-3 mb-6">
        <input
          className="border p-2 block w-72"
          placeholder="Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Preparing..." : "Start Round"}
        </button>
      </form>

      {edges.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">Network (random capacities)</h3>
          <div className="border rounded p-3 bg-gray-50 w-[420px] text-sm text-left">
            {edges.map((e, i) => (
              <div key={i}>
                {e.from} → {e.to} : <b>{e.capacity}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {choices.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">
            🔢 Choose maximum flow from A → T
          </h3>
          <div className="flex gap-3">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => submitChoice(c)}
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
          <h3 className="font-semibold mb-2">⏱ Algorithm timings</h3>
          <div className="border rounded p-3 w-[420px]">
            {algos.map((a) => (
              <div key={a.name} className="flex justify-between">
                <span>{a.name}</span>
                <span>
                  max flow: <b>{a.maxFlow}</b> • time: <b>{a.timeMs} ms</b>
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
            You chose: <b>{result.choice}</b>
          </p>
          <p>
            Correct answer: <b>{result.correct}</b>
          </p>
          <p
            className={`mt-2 font-bold ${
              result.outcome === "win"
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
        </section>
      )}
    </main>
  );
}
