import express from "express";
import db from "../db/connection.js";

import {
  PEGS_3,
  PEGS_4,
  hanoi3Recursive,
  hanoi3Iterative,
  hanoi4NaiveVia3,
  frameStewart4,
  buildChoicesHanoi,
  outcomeForHanoi,
  formatMoves,
  validateHanoiSequence,
} from "../logic/towerHanoi.js";

const router = express.Router();

router.post("/new-game", async (req, res) => {
  try {
    const { playerName, pegs } = req.body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required" });
    }

    const pegCount = Number(pegs);
    if (pegCount !== 3 && pegCount !== 4) {
      return res.status(400).json({ error: "pegs must be 3 or 4" });
    }

    const disks = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

    const pegLabels = pegCount === 3 ? PEGS_3 : PEGS_4;
    const source = "A";
    const dest = "D";

    let algoResults = [];
    let correctMovesCount;
    let optimalSequenceIndices;

    if (pegCount === 3) {
      const t1s = performance.now();
      const movesRec = hanoi3Recursive(disks, source, pegLabels[1], dest, []);
      const t1e = performance.now();

      const t2s = performance.now();
      const movesIter = hanoi3Iterative(disks, source, pegLabels[1], dest);
      const t2e = performance.now();

      correctMovesCount = movesRec.length;
      optimalSequenceIndices = movesRec;

      algoResults = [
        { name: "3-Peg Recursive", moves: movesRec.length, timeMs: Math.round(t1e - t1s) },
        { name: "3-Peg Iterative", moves: movesIter.length, timeMs: Math.round(t2e - t2s) },
      ];
    } else {
      const t1s = performance.now();
      const fs = frameStewart4(disks, pegLabels, source, dest);
      const t1e = performance.now();

      const t2s = performance.now();
      const naiveMoves = hanoi4NaiveVia3(disks, pegLabels);
      const t2e = performance.now();

      correctMovesCount = fs.moves.length;
      optimalSequenceIndices = fs.moves;

      algoResults = [
        { name: "4-Peg Frame-Stewart", moves: fs.moves.length, timeMs: Math.round(t1e - t1s) },
        { name: "4-Peg via 3-Peg", moves: naiveMoves.length, timeMs: Math.round(t2e - t2s) },
      ];
    }

    const optimalSequence = formatMoves(optimalSequenceIndices);

    const [gameResult] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      [
        "Tower of Hanoi",
        JSON.stringify({
          disks,
          pegs: pegCount,
          pegLabels,
          source,
          dest,
          optimalMoves: correctMovesCount,
          optimalSequence,
        }),
      ]
    );

    const gameId = gameResult.insertId;

    const runsValues = [];
    for (const ar of algoResults) {
      runsValues.push(gameId, ar.name, "moves", ar.moves, ar.timeMs);
    }

    const placeholders = algoResults.map(() => "(?, ?, ?, ?, ?)").join(", ");

    await db.execute(
      `INSERT INTO algorithm_runs
       (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES ${placeholders}`,
      runsValues
    );

    const choices = buildChoicesHanoi(correctMovesCount);

    console.log("🗼 New Hanoi game:", {
      gameId,
      playerName,
      disks,
      pegCount,
      optimalMoves: correctMovesCount,
      choices,
    });

    return res.json({
      gameId,
      playerName,
      disks,
      pegs: pegCount,
      source,
      dest,
      pegLabels,
      choices,
      algorithms: algoResults,
      optimalSequence,
    });
  } catch (err) {
    console.error("💥 Error in /tower-hanoi/new-game:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { gameId, playerName, movesGuess, sequenceText } = req.body;

    if (!gameId || !playerName || movesGuess === undefined) {
      return res
        .status(400)
        .json({ error: "gameId, playerName and movesGuess are required" });
    }

    const [[game]] = await db.execute(
      "SELECT * FROM games WHERE id = ?",
      [gameId]
    );

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const cfg =
      typeof game.config_json === "string"
        ? JSON.parse(game.config_json)
        : game.config_json;

    const { disks, pegs, pegLabels, source, dest } = cfg || {};
    if (!disks || !pegs || !pegLabels || !source || !dest) {
      return res.status(500).json({ error: "Invalid game configuration" });
    }

    if (sequenceText && sequenceText.trim()) {
      const validation = validateHanoiSequence({
        sequenceText,
        disks,
        pegLabels,
        source,
        dest,
      });

      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid move sequence",
          details: validation.error,
        });
      }
    }

    let correctMovesCount;
    let optimalSequenceIndices;

    if (pegs === 3) {
      const movesRec = hanoi3Recursive(disks, source, pegLabels[1], dest, []);
      correctMovesCount = movesRec.length;
      optimalSequenceIndices = movesRec;
    } else {
      const fs = frameStewart4(disks, pegLabels, source, dest);
      correctMovesCount = fs.moves.length;
      optimalSequenceIndices = fs.moves;
    }

    const optimalSequence = formatMoves(optimalSequenceIndices);
    const guess = Number(movesGuess);
    const outcome = outcomeForHanoi(guess, correctMovesCount);

    console.log("🗼 Hanoi submit:", {
      gameId,
      playerName,
      guess,
      correctMoves: correctMovesCount,
      outcome,
    });

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, answer_json) VALUES (?, ?, ?)",
        [
          gameId,
          playerName,
          JSON.stringify({
            disks,
            pegs,
            moves: correctMovesCount,
            playerSequenceText: sequenceText || "",
            optimalSequence,
          }),
        ]
      );
    }

    return res.json({
      gameId,
      playerName,
      movesGuess: guess,
      correctMoves: correctMovesCount,
      optimalSequence,
      outcome,
    });
  } catch (err) {
    console.error("💥 Error in /hanoi/submit:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
