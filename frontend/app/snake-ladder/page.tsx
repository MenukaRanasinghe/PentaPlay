"use client";

import { useState } from "react";
import axios from "axios";

interface Result {
  playerName: string;
  minThrows: number;
  timeTaken: number;
}

export default function SnakeLadder() {
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const playerName = formData.get("playerName") as string;
    const boardSize = formData.get("boardSize") as string;

    try {
      const res = await axios.post<Result>("http://localhost:5000/snake-ladder", {
        playerName,
        boardSize,
      });
      setResult(res.data);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Unable to connect to backend. Check if Node server is running.");
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">🐍 Snake & Ladder</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="playerName"
          placeholder="Player Name"
          required
          className="border p-2 block w-64"
        />
        <input
          name="boardSize"
          type="number"
          min={6}
          max={12}
          placeholder="Board Size (6–12)"
          required
          className="border p-2 block w-64"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Play
        </button>
      </form>

      {result && (
        <div className="mt-6 border p-4 rounded bg-gray-100 w-64">
          <p>
            ✅ <strong>{result.playerName}</strong>
          </p>
          <p>🎲 Minimum throws: {result.minThrows}</p>
          <p>⏱ Time taken: {result.timeTaken}s</p>
        </div>
      )}
    </main>
  );
}
