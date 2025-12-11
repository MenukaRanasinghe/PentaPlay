"use client";

import { useState } from "react";
import axios from "axios";

const ALL_CITIES = ["A","B","C","D","E","F","G","H","I","J"];

type AlgoRow = {
  name: string;
  distance: number;
  timeMs: number;
};

export default function TravellingSalesmanPage() {
  const [playerName, setPlayerName] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [algos, setAlgos] = useState<AlgoRow[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [bestRoute, setBestRoute] = useState<string[] | null>(null);

  const [result, setResult] = useState<null | {
    outcome: "win" | "lose" | "draw";
    correct: number;
    choice: number;
    route: string[];
  }>(null);

  function toggleCity(city: string) {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  }

  async function startGame(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setHomeCity(null);
    setChoices([]);
    setAlgos([]);
    setEdges([]);
    setBestRoute(null);

    if (!playerName.trim()) {
      alert("Please enter player name");
      return;
    }
    if (selectedCities.length === 0) {
      alert("Please select at least one city to visit");
      return;
    }
    if (selectedCities.length >= ALL_CITIES.length) {
      alert("You cannot select all cities – one must be home");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/travelling-salesman/new-game", {
        playerName,
        selectedCities,
      });

      setGameId(res.data.gameId);
      setHomeCity(res.data.homeCity);
      setChoices(res.data.choices);
      setAlgos(res.data.algorithms);
      setEdges(res.data.edges);
      setBestRoute(res.data.bestRoute || null);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Failed to start TSP game");
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice(choice: number) {
    if (!gameId) return;
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/travelling-salesman/submit", {
        gameId,
        playerName,
        choice,
      });

      setResult({
        outcome: res.data.outcome,
        correct: res.data.correct,
        choice: res.data.choice,
        route: res.data.route,
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🧭 Travelling Salesman Problem</h1>

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
          <p className="font-semibold mb-1">Select cities to visit (A–J)</p>
          <p className="text-sm text-gray-600 mb-2">
            The system will randomly choose a different city as the home city.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {ALL_CITIES.map((c) => (
              <label key={c} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCities.includes(c)}
                  onChange={() => toggleCity(c)}
                />
                {c}
              </label>
            ))}
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

      {homeCity && (
        <section className="mb-4">
          <h2 className="font-semibold mb-1">🏠 Home City</h2>
          <p>
            Home city for this round:{" "}
            <span className="font-bold">{homeCity}</span>
          </p>
          <p className="text-sm text-gray-600">
            You must start and end at {homeCity}, visiting each selected city exactly once.
          </p>
        </section>
      )}

      {edges.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">🗺 Distances</h3>
          <div className="border rounded p-3 bg-gray-50 w-[420px] text-sm max-h-64 overflow-auto">
            {edges.map((e, i) => (
              <div key={i}>
                {e.from} – {e.to}: <b>{e.distance} km</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {choices.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">
            🔢 Choose the total length of the shortest tour
          </h3>
          <div className="flex gap-3">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => submitChoice(c)}
                disabled={loading}
                className="border rounded px-4 py-2 hover:bg-gray-100"
              >
                {c} km
              </button>
            ))}
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
                  distance: <b>{a.distance} km</b> • time: <b>{a.timeMs} ms</b>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {bestRoute && (
        <section className="mb-6">
          <h3 className="font-semibold mb-2">✅ Optimal route (for report/debug)</h3>
          <p className="text-sm text-gray-700">{bestRoute.join(" → ")}</p>
        </section>
      )}

      {result && (
        <section className="border rounded p-4 w-[420px] bg-gray-50">
          <h3 className="font-semibold mb-2">Result</h3>
          <p>
            You chose: <b>{result.choice} km</b>
          </p>
          <p>
            Correct tour length: <b>{result.correct} km</b>
          </p>
          <p className="mt-1 text-sm">
            Optimal route: <b>{result.route.join(" → ")}</b>
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
            {result.outcome === "draw" && "🟡 Draw (close!)"}
            {result.outcome === "lose" && "❌ You lose"}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            (Only wins are saved with your name in the database.)
          </p>
        </section>
      )}
    </main>
  );
}
