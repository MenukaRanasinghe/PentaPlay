"use client";

import { useState, useMemo } from "react";
import axios from "axios";

const ALL_CITIES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

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

  const title = useMemo(() => "🧭 Travelling Salesman", []);

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

    if (!playerName.trim()) return alert("Enter player name");
    if (selectedCities.length === 0) return alert("Select at least one city");
    if (selectedCities.length >= ALL_CITIES.length)
      return alert("You cannot select all cities");

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/travelling-salesman/new-game",
        { playerName, selectedCities }
      );

      setGameId(res.data.gameId);
      setHomeCity(res.data.homeCity);
      setChoices(res.data.choices);
      setAlgos(res.data.algorithms);
      setEdges(res.data.edges);
      setBestRoute(res.data.bestRoute || null);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to start game");
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice(choice: number) {
    if (!gameId) return;

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/travelling-salesman/submit",
        { gameId, playerName, choice }
      );

      setResult(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Submit failed");
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

            <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <form onSubmit={startGame} className="grid gap-4">
                  <input
                    className="rounded-lg p-3 bg-black/40 border border-white/20 placeholder-gray-300"
                    placeholder="Player Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />

                  <div>
                    <p className="font-semibold mb-2 text-gray-200">
                      Select cities to visit
                    </p>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {ALL_CITIES.map(c => (
                        <label key={c} className="flex items-center gap-1">
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
                    className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold"
                  >
                    {loading ? "Preparing..." : "Start Round"}
                  </button>
                </form>

                {choices.length > 0 && (
                  <div className="mt-6 text-center">
                    <h2 className="font-semibold mb-3 text-gray-200">
                      Choose shortest tour length
                    </h2>
                    <div className="flex justify-center gap-3 flex-wrap">
                      {choices.map(c => (
                        <button
                          key={c}
                          onClick={() => submitChoice(c)}
                          className="w-24 py-3 rounded-xl bg-black/50 border border-white/20"
                        >
                          {c}
                        </button>
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
                    <p>Correct: {result.correct}</p>
                    <p className="mt-2">
                      {result.outcome === "win" && "✅ You win!"}
                      {result.outcome === "draw" && "🟡 Draw"}
                      {result.outcome === "lose" && "❌ You lose"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                {!homeCity ? (
                  <div className="text-center text-gray-300 py-16">
                    Start a round to generate distances.
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold mb-2 text-center text-gray-200">
                      Home City: {homeCity}
                    </h3>

                    <div className="text-sm max-h-64 overflow-auto">
                      {edges.map((e: any, i: number) => (
                        <div key={i}>
                          {e.from} – {e.to}: <b>{e.distance} km</b>
                        </div>
                      ))}
                    </div>

                    {result && algos.length > 0 && (
                      <div className="mt-4 text-sm">
                        {algos.map(a => (
                          <div key={a.name} className="flex justify-between">
                            <span>{a.name}</span>
                            <span>{a.distance} • {a.timeMs} ms</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {bestRoute && (
                      <div className="mt-3 text-xs text-gray-300">
                        Optimal route: {bestRoute.join(" → ")}
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
