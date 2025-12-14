"use client";

import { useState } from "react";
import axios from "axios";

type PegState = Record<string, number[]>;

type ResultState = {
  outcome: "win" | "lose" | "draw";
  movesGuess: number;
  correctMoves: number;
  optimalSequence: string[];
} | null;

export default function TowerOfHanoiPage() {
  const [playerName, setPlayerName] = useState("");
  const [pegs, setPegs] = useState<3 | 4>(3);
  const [loading, setLoading] = useState(false);

  const [gameId, setGameId] = useState<number | null>(null);
  const [disks, setDisks] = useState<number | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [pegLabels, setPegLabels] = useState<string[]>([]);

  const [pegState, setPegState] = useState<PegState>({});
  const [selectedPeg, setSelectedPeg] = useState<string | null>(null);

  const [sequenceText, setSequenceText] = useState("");
  const [result, setResult] = useState<ResultState>(null);

  const [movesGuess, setMovesGuess] = useState<number | "">("");

  async function startGame(e: React.FormEvent) {
    e.preventDefault();

    if (!playerName.trim()) {
      alert("Please enter player name");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setSequenceText("");
      setMovesGuess("");
      setSelectedPeg(null);

      const res = await axios.post(
        "http://localhost:5000/tower-hanoi/new-game",
        { playerName, pegs }
      );

      setGameId(res.data.gameId);
      setDisks(res.data.disks);
      setSource(res.data.source);
      setDest(res.data.dest);
      setPegLabels(res.data.pegLabels);

      const state: PegState = {};
      res.data.pegLabels.forEach((p: string) => (state[p] = []));
      for (let i = res.data.disks; i >= 1; i--) {
        state[res.data.source].push(i);
      }
      setPegState(state);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to start game");
    } finally {
      setLoading(false);
    }
  }

  function onPegClick(peg: string) {
    if (!pegState[peg]) return;

    if (!selectedPeg) {
      if (pegState[peg].length === 0) return;
      setSelectedPeg(peg);
      return;
    }

    if (selectedPeg === peg) {
      setSelectedPeg(null);
      return;
    }

    const from = selectedPeg;
    const to = peg;

    const fromStack = pegState[from];
    const toStack = pegState[to];

    const disk = fromStack[fromStack.length - 1];
    const topDest = toStack[toStack.length - 1];

    if (topDest && topDest < disk) {
      alert("Illegal move ❌");
      setSelectedPeg(null);
      return;
    }

    const newState = { ...pegState };
    newState[from] = fromStack.slice(0, -1);
    newState[to] = [...toStack, disk];

    setPegState(newState);
    setSequenceText((s) => (s ? `${s}, ${from}->${to}` : `${from}->${to}`));
    setSelectedPeg(null);
  }

  async function submitAnswer() {
    if (!gameId || movesGuess === "") {
      alert("Please enter number of moves");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/tower-hanoi/submit",
        {
          gameId,
          playerName,
          movesGuess: Number(movesGuess), 
          sequenceText,
        }
      );

      setResult({
        outcome: res.data.outcome,
        movesGuess: res.data.movesGuess,
        correctMoves: res.data.correctMoves,
        optimalSequence: res.data.optimalSequence,
      });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-white flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-6xl bg-black/40 border border-white/10 rounded-3xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          🗼 Tower of Hanoi
        </h1>

        <section className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-stretch">
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <form onSubmit={startGame} className="grid gap-4">
              <input
                className="p-3 rounded bg-black/40 border border-white/20"
                placeholder="Player Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />

              <div className="flex gap-4 text-sm">
                <label>
                  <input type="radio" checked={pegs === 3} onChange={() => setPegs(3)} /> 3 Pegs
                </label>
                <label>
                  <input type="radio" checked={pegs === 4} onChange={() => setPegs(4)} /> 4 Pegs
                </label>
              </div>

              <button className="h-12 bg-blue-600 rounded-xl font-semibold">
                Start Round
              </button>
            </form>

            {disks && (
              <>
                <input
                  type="number"
                  min={1}
                  placeholder="Enter number of moves"
                  value={movesGuess}
                  onChange={(e) => setMovesGuess(Number(e.target.value))}
                  className="p-3 rounded bg-black/40 border border-white/20"
                />

                <button
                  onClick={submitAnswer}
                  className="h-12 bg-green-600 rounded-xl font-semibold"
                >
                  Submit Answer
                </button>
              </>
            )}

            {result && (
              <div
                className={`p-4 rounded-xl text-center ${
                  result.outcome === "win"
                    ? "bg-green-500/20 text-green-300"
                    : result.outcome === "draw"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                <p>You: {result.movesGuess}</p>
                <p>Correct: {result.correctMoves}</p>
              </div>
            )}
          </div>

          <div className="bg-black/30 border border-white/10 rounded-2xl p-6">
            <h2 className="text-center mb-4">Puzzle</h2>

            <div className="flex justify-center gap-6">
              {pegLabels.map((peg) => (
                <div key={peg} onClick={() => onPegClick(peg)} className="cursor-pointer">
                  <div className="text-center mb-2">
                    {peg}
                    {peg === source && " 🏁"}
                    {peg === dest && " 🎯"}
                  </div>
                  <div className="w-28 h-52 border border-white/20 rounded-xl flex flex-col-reverse items-center gap-1 p-2">
                    {(pegState[peg] || []).map((d, i) => (
                      <div key={i} className="h-3 bg-blue-500 rounded" style={{ width: `${40 + d * 8}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
