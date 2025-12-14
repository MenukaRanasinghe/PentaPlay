import express from "express";
import db from "../db/connection.js";
import { performance } from "node:perf_hooks";
import {
  generateTrafficGraph,
  edmondsKarpMaxFlow,
  dinicMaxFlow,
  buildChoices,
  outcomeFor,
} from "../logic/trafficSimulation.js";

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
    const { playerName } = req.body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required" });
    }

    const { graph, edges } = generateTrafficGraph();

    const t1s = performance.now();
    const ekFlow = edmondsKarpMaxFlow(graph, "A", "T");
    const t1e = performance.now();

    const t2s = performance.now();
    const dinicFlow = dinicMaxFlow(graph, "A", "T");
    const t2e = performance.now();

    const correctAnswer = ekFlow;

    console.log("🚦 Traffic Simulation");
    console.log("Player:", playerName.trim());
    console.log("Correct Max Flow (A → T):", correctAnswer);
    const choices = buildChoices(correctAnswer);

    console.log("Edmonds-Karp:", ekFlow);
    console.log("Dinic:", dinicFlow);


    const config = {
      playerName: playerName.trim(),
      edges,
      choices,
      correct: correctAnswer,
    };

    const [gameResult] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      ["traffic_simulation", JSON.stringify(config)]
    );

    const gameId = gameResult.insertId;

    await db.execute(
      `INSERT INTO algorithm_runs
       (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES 
       (?, 'Edmonds-Karp', 'max_flow', ?, ?),
       (?, 'Dinic', 'max_flow', ?, ?)`,
      [
        gameId, ekFlow, Math.round(t1e - t1s),
        gameId, dinicFlow, Math.round(t2e - t2s),
      ]
    );

    return res.json({
      gameId,
      playerName: playerName.trim(),
      choices,
      edges,
    });
  } catch (err) {
    console.error("💥 Error in /traffic-simulation/new-game:", err);
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
      return res.status(400).json({ error: "gameId, playerName, and choice are required" });
    }

    const [[game]] = await db.execute("SELECT * FROM games WHERE id = ?", [gameId]);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const config = safeJson(game.config_json, {});
    const storedPlayer = String(config.playerName || "").trim();
    const storedChoices = Array.isArray(config.choices) ? config.choices.map(Number) : [];
    const edges = Array.isArray(config.edges) ? config.edges : null;

    if (!edges) {
      return res.status(500).json({ error: "Saved game config is invalid (edges missing)" });
    }

    if (storedPlayer && storedPlayer !== String(playerName).trim()) {
      return res.status(403).json({ error: "playerName does not match this game round" });
    }

    const playerChoice = Number(choice);
    if (!Number.isFinite(playerChoice)) {
      return res.status(400).json({ error: "choice must be a number" });
    }

    if (!storedChoices.includes(playerChoice)) {
      return res.status(400).json({ error: "Invalid choice (must be one of the 3 options)" });
    }

    const { graph } = generateTrafficGraph(edges, false);

    const correct = edmondsKarpMaxFlow(graph, "A", "T");
    const outcome = outcomeFor(playerChoice, correct);

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, answer_json) VALUES (?, ?, ?)",
        [
          gameId,
          String(playerName).trim(),
          JSON.stringify({ correct_max_flow: correct, player_choice: playerChoice }),
        ]
      );
    }

    return res.json({
      gameId,
      playerName: String(playerName).trim(),
      choice: playerChoice,
      correct,
      outcome,
    });
  } catch (err) {
    console.error("💥 Error in /traffic-simulation/submit:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: err?.message,
      code: err?.code,
    });
  }
});

export default router;
