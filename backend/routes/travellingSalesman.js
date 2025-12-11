import express from "express";
import db from "../db/connection.js";
import {
  CITIES,
  generateDistanceMatrix,
  cityIndex,
  nearestNeighbourTsp,
  bruteForceTsp,
  heldKarpTsp,
  buildChoicesTsp,
  outcomeForTsp,
  routeToCities,
} from "../logic/travellingSalesman.js";

const router = express.Router();

router.post("/new-game", async (req, res) => {
  try {
    const { playerName, selectedCities } = req.body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required" });
    }

    if (!Array.isArray(selectedCities) || selectedCities.length === 0) {
      return res
        .status(400)
        .json({ error: "Select at least one city to visit." });
    }

    const unique = [...new Set(selectedCities)];
    for (const c of unique) {
      if (!CITIES.includes(c)) {
        return res.status(400).json({ error: `Invalid city: ${c}` });
      }
    }

    if (unique.length >= CITIES.length) {
      return res
        .status(400)
        .json({ error: "You cannot select all cities; one will be home." });
    }

    const allowedHome = CITIES.filter(c => !unique.includes(c));
    const homeCity = allowedHome[Math.floor(Math.random() * allowedHome.length)];
    const homeIndex = cityIndex(homeCity);

    const distanceMatrix = generateDistanceMatrix();

    const targetIndices = unique.map(cityIndex);

    if (targetIndices.length > 8) {
      return res
        .status(400)
        .json({ error: "Please choose at most 8 cities for this demo (complexity limit)." });
    }

    const t1s = performance.now();
    const nnResult = nearestNeighbourTsp(distanceMatrix, homeIndex, targetIndices);
    const t1e = performance.now();

    const t2s = performance.now();
    const bfResult = bruteForceTsp(distanceMatrix, homeIndex, targetIndices);
    const t2e = performance.now();

    const t3s = performance.now();
    const hkResult = heldKarpTsp(distanceMatrix, homeIndex, targetIndices);
    const t3e = performance.now();

    const correctDistance = bfResult.distance;
    const correctRouteCities = routeToCities(bfResult.route);

    const [gameResult] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      [
        "TSP",
        JSON.stringify({
          cities: CITIES,
          distanceMatrix,
          homeCity,
          selectedCities: unique,
        }),
      ]
    );
    const gameId = gameResult.insertId;

    await db.execute(
      `INSERT INTO algorithm_runs 
       (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES
       (?, ?, 'tour_length', ?, ?),
       (?, ?, 'tour_length', ?, ?),
       (?, ?, 'tour_length', ?, ?)`,
      [
        gameId, "Nearest Neighbour", nnResult.distance, Math.round(t1e - t1s),
        gameId, "Brute Force",      bfResult.distance,  Math.round(t2e - t2s),
        gameId, "Held-Karp DP",     hkResult.distance,  Math.round(t3e - t3s),
      ]
    );

    const choices = buildChoicesTsp(correctDistance);

    console.log("🧭 New TSP game:", {
      gameId,
      homeCity,
      selectedCities: unique,
      correctDistance,
      correctRouteCities,
      choices,
    });

    const edges = [];
    for (let i = 0; i < CITIES.length; i++) {
      for (let j = i + 1; j < CITIES.length; j++) {
        edges.push({
          from: CITIES[i],
          to: CITIES[j],
          distance: distanceMatrix[i][j],
        });
      }
    }

    return res.json({
      gameId,
      playerName,
      homeCity,
      selectedCities: unique,
      choices,
      algorithms: [
        { name: "Nearest Neighbour", distance: nnResult.distance, timeMs: Math.round(t1e - t1s) },
        { name: "Brute Force (Exact)", distance: bfResult.distance, timeMs: Math.round(t2e - t2s) },
        { name: "Held-Karp DP (Exact)", distance: hkResult.distance, timeMs: Math.round(t3e - t3s) },
      ],
      bestRoute: correctRouteCities,
      edges,
    });
  } catch (err) {
    console.error("💥 Error in /travelling-salesman/new-game:", err);
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
    if (!game) return res.status(404).json({ error: "Game not found" });

    const cfg =
      typeof game.config_json === "string"
        ? JSON.parse(game.config_json)
        : game.config_json;

    const { distanceMatrix, homeCity, selectedCities } = cfg || {};
    if (!distanceMatrix || !homeCity || !Array.isArray(selectedCities)) {
      return res.status(500).json({ error: "Invalid game configuration" });
    }

    const homeIndex = cityIndex(homeCity);
    const targetIndices = selectedCities.map(cityIndex);

    const bf = bruteForceTsp(distanceMatrix, homeIndex, targetIndices);
    const correctDistance = bf.distance;
    const correctRouteCities = routeToCities(bf.route);

    const playerChoice = Number(choice);
    const outcome = outcomeForTsp(playerChoice, correctDistance);

    console.log("🧭 TSP Submit:", {
      gameId,
      playerName,
      choice: playerChoice,
      correctDistance,
      outcome,
    });

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, answer_json) VALUES (?, ?, ?)",
        [
          gameId,
          playerName,
          JSON.stringify({
            homeCity,
            selectedCities,
            route: correctRouteCities,
            distance: correctDistance,
          }),
        ]
      );
    }

    return res.json({
      gameId,
      playerName,
      choice: playerChoice,
      correct: correctDistance,
      route: correctRouteCities,
      outcome,
    });
  } catch (err) {
    console.error("💥 Error in /travelling-salesman/submit:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
