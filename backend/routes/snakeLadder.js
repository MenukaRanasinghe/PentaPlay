import express from "express";
import db from "../db/connection.js";
import {
  generateBoard,
  bfsMinThrows,
  dijkstraMinThrows,
  buildChoices,
  outcomeFor,
} from "../logic/snakeLadder.js";

const router = express.Router();


function safeParse(str) {
  if (!str) return [];
  try {
    const val = JSON.parse(str);
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch (e) {
    console.error("❌ JSON parse failed:", e.message, "INPUT:", str);
    return [];
  }
}

router.post("/new-game", async (req, res) => {
  try {
    const { playerName, boardSize } = req.body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required" });
    }
    const N = parseInt(boardSize, 10);
    if (Number.isNaN(N) || N < 6 || N > 12) {
      return res
        .status(400)
        .json({ error: "boardSize must be between 6 and 12" });
    }

    const { board, ladders, snakes } = generateBoard(N);

    const t1s = performance.now();
    const bfsAns = bfsMinThrows(board, N);
    const t1e = performance.now();

    const t2s = performance.now();
    const dijAns = dijkstraMinThrows(board, N);
    const t2e = performance.now();

    const answer = bfsAns; 

    const [gameResult] = await db.execute(
      "INSERT INTO games (board_size, ladders_json, snakes_json) VALUES (?, ?, ?)",
      [N, JSON.stringify(ladders), JSON.stringify(snakes)]
    );
    const gameId = gameResult.insertId;

    await db.execute(
      "INSERT INTO algorithm_runs (game_id, algorithm_name, min_throws, time_ms) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
      [
        gameId,
        "BFS",
        bfsAns,
        Math.round(t1e - t1s),
        gameId,
        "Dijkstra",
        dijAns,
        Math.round(t2e - t2s),
      ]
    );

    const choices = buildChoices(answer, N);

    console.log("🎮 New game created:");
    console.log("Game ID:", gameId);
    console.log("Board size:", N);
    console.log("Ladders:", ladders);
    console.log("Snakes:", snakes);
    console.log("Correct answer:", answer);
    console.log("Choices:", choices);

    return res.json({
      gameId,
      playerName,
      boardSize: N,
      choices,
      algorithms: [
        { name: "BFS", minThrows: bfsAns, timeMs: Math.round(t1e - t1s) },
        { name: "Dijkstra", minThrows: dijAns, timeMs: Math.round(t2e - t2s) },
      ],
      boardDebug: {
        ladders,
        snakes,
      },
    });
  } catch (err) {
    console.error("💥 Error in /new-game:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { gameId, playerName, choice } = req.body;

    if (!gameId || !playerName || choice === undefined) {
      return res
        .status(400)
        .json({ error: "gameId, playerName, and choice are required" });
    }

    const [[game]] = await db.execute("SELECT * FROM games WHERE id = ?", [
      gameId,
    ]);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const ladders = safeParse(game.ladders_json);
    const snakes = safeParse(game.snakes_json);
    const N = game.board_size;

    const total = N * N;
    const board = Array(total + 1).fill(-1);
    for (const [b, t] of ladders) board[b] = t;
    for (const [h, t] of snakes) board[h] = t;

    const correct = bfsMinThrows(board, N);
    const playerChoice = Number(choice);
    const outcome = outcomeFor(playerChoice, correct);

    console.log("🧩 Submit:", {
      gameId,
      playerName,
      choice: playerChoice,
      correct,
      outcome,
    });

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, min_throws) VALUES (?, ?, ?)",
        [gameId, playerName, correct]
      );
    }

    return res.json({
      gameId,
      playerName,
      choice: playerChoice,
      correct,
      outcome,
    });
  } catch (err) {
    console.error("💥 Error in /submit:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
