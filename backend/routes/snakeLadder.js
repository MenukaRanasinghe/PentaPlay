import express from "express";
import db from "../db/connection.js";
import { performance } from "node:perf_hooks";
import {
  generateSolvableRound,
  bfsMinThrows,
  dijkstraMinThrows,
  buildChoices,
  outcomeFor,
} from "../logic/snakeLadder.js";

const router = express.Router();

function safeJson(val, fallback = null) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

router.post("/new-game", async (req, res) => {
  try {
    const { playerName, boardSize } = req.body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required" });
    }
    const N = parseInt(boardSize, 10);
    if (Number.isNaN(N) || N < 6 || N > 12) {
      return res.status(400).json({ error: "boardSize must be between 6 and 12" });
    }

    const { board, ladders, snakes, answer } = generateSolvableRound(N);

    const t1s = performance.now();
    const bfsAns = bfsMinThrows(board, N);
    const t1e = performance.now();

    const t2s = performance.now();
    const dijAns = dijkstraMinThrows(board, N);
    const t2e = performance.now();

    const choices = buildChoices(answer);

    const config = {
      playerName: playerName.trim(),
      boardSize: N,
      ladders,
      snakes,
      choices,
      correct: answer,
    };

    const [gameRow] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      ["snake_ladder", JSON.stringify(config)]
    );

    const gameId = gameRow.insertId;

    await db.execute(
      `INSERT INTO algorithm_runs
       (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES
       (?, 'BFS', 'min_throws', ?, ?),
       (?, 'Dijkstra', 'min_throws', ?, ?)`,
      [
        gameId, bfsAns, Math.round(t1e - t1s),
        gameId, dijAns, Math.round(t2e - t2s),
      ]
    );

    return res.json({
      gameId,
      playerName: playerName.trim(),
      boardSize: N,
      choices,
      algorithms: [
        //  { name: "BFS", minThrows: bfsAns, timeMs: Math.round(t1e - t1s) },
        //{ name: "Dijkstra", minThrows: dijAns, timeMs: Math.round(t2e - t2s) },
        { name: "BFS", timeMs: Math.round(t1e - t1s) },
        { name: "Dijkstra", timeMs: Math.round(t2e - t2s) },
      ],
      boardDebug: { ladders, snakes },
    });
  } catch (err) {
    console.error("💥 Error in /new-game:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err?.message,
      code: err?.code,
    });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { gameId, playerName, choice } = req.body;

    if (!gameId || !playerName || choice === undefined) {
      return res.status(400).json({
        error: "gameId, playerName, and choice are required"
      });
    }

    const [[game]] = await db.execute(
      "SELECT * FROM games WHERE id = ?",
      [gameId]
    );

    if (!game) {
      return res.status(404).json({ error: "Game round not found" });
    }

    const config = safeJson(game.config_json, {});
    const storedPlayer = String(config.playerName || "").trim();
    const correct = Number(config.correct);
    const choices = Array.isArray(config.choices)
      ? config.choices.map(Number)
      : [];

    if (storedPlayer && storedPlayer !== String(playerName).trim()) {
      return res.status(403).json({
        error: "playerName does not match this game"
      });
    }

    const playerChoice = Number(choice);
    if (!choices.includes(playerChoice)) {
      return res.status(400).json({
        error: "Invalid choice (must be one of the 3 options)"
      });
    }

    const outcome = outcomeFor(playerChoice, correct);

    if (outcome === "win") {

      const [runs] = await db.execute(
        "SELECT algorithm_name, time_ms FROM algorithm_runs WHERE game_id = ?",
        [gameId]
      );

      const bfsTime =
        runs.find(r => r.algorithm_name === "BFS")?.time_ms ?? 0;

      const dijkstraTime =
        runs.find(r => r.algorithm_name === "Dijkstra")?.time_ms ?? 0;

      await db.execute(
        `INSERT INTO snake_ladder_results
         (game_id, player_name, board_size, min_throws, player_choice, bfs_time_ms, dijkstra_time_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          String(playerName).trim(),
          Number(config.boardSize),
          correct,
          playerChoice,
          bfsTime,
          dijkstraTime
        ]
      );
    }

    return res.json({
      gameId,
      playerName: String(playerName).trim(),
      choice: playerChoice,
      outcome
    });

  } catch (err) {
    console.error("💥 Error in /submit:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err?.message
    });
  }
});


export default router;
