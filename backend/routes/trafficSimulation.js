import express from "express";
import db from "../db/connection.js";
import {
  generateTrafficGraph,
  edmondsKarpMaxFlow,
  dinicMaxFlow,
  buildChoices,
  outcomeFor,
} from "../logic/trafficSimulation.js";

const router = express.Router();

router.post("/new-game", async (req, res) => {
  try {
    const { playerName } = req.body;

    if (!playerName || !playerName.trim()) {
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

    const [gameResult] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      ["Traffic Simulation", JSON.stringify({ edges })]
    );
    const gameId = gameResult.insertId;

    await db.execute(
      `INSERT INTO algorithm_runs (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES 
       (?, 'Edmonds-Karp', 'max_flow', ?, ?),
       (?, 'Dinic', 'max_flow', ?, ?)`,
      [
        gameId, ekFlow, Math.round(t1e - t1s),
        gameId, dinicFlow, Math.round(t2e - t2s)
      ]
    );

    const choices = buildChoices(correctAnswer);

    console.log("🚦 New traffic game:", { gameId, correctAnswer, choices });

    res.json({
      gameId,
      choices,
      algorithms: [
        { name: "Edmonds-Karp", maxFlow: ekFlow, timeMs: Math.round(t1e - t1s) },
        { name: "Dinic", maxFlow: dinicFlow, timeMs: Math.round(t2e - t2s) }
      ],
      edges
    });

  } catch (err) {
    console.error("💥 Error in /traffic-simulation/new-game:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { gameId, playerName, choice } = req.body;

    if (!gameId || !playerName || choice === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [[game]] = await db.execute("SELECT * FROM games WHERE id = ?", [gameId]);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const edges = game.config_json.edges;

    const { graph } = generateTrafficGraph(edges, false);

    const correct = edmondsKarpMaxFlow(graph, "A", "T");

    const playerChoice = Number(choice);
    const outcome = outcomeFor(playerChoice, correct);

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, answer_json) VALUES (?, ?, ?)",
        [gameId, playerName, JSON.stringify({ max_flow: correct })]
      );
    }

    res.json({ gameId, playerName, choice: playerChoice, correct, outcome });

  } catch (err) {
    console.error("💥 Error in /traffic-simulation/submit:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
