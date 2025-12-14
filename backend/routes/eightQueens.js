import express from "express";
import db from "../db/connection.js";
import {
  solveEightQueensSequential,
  solveEightQueensThreaded,
  solutionToSig,
  buildChoicesQueens,
  outcomeForQueens,
  parseSolutionPattern,
} from "../logic/eightQueens.js";

const router = express.Router();

router.post("/new-game", async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName?.trim())
      return res.status(400).json({ error: "playerName required" });

    const seq = solveEightQueensSequential();
    const thr = await solveEightQueensThreaded();

    if (seq.total !== thr.total)
      throw new Error("Sequential / Threaded mismatch");

    const solutionSigs = seq.solutions.map(solutionToSig);

    const [game] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      [
        "Eight Queens",
        JSON.stringify({
          boardSize: 8,
          totalSolutions: seq.total,
          solutionSigs,
        }),
      ]
    );

    const gameId = game.insertId;

    await db.execute(
      `INSERT INTO algorithm_runs 
       (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [
        gameId,
        "Sequential",
        "total_solutions",
        seq.total,
        seq.timeMs,
        gameId,
        "Threaded (Worker Threads)",
        "total_solutions",
        thr.total,
        thr.timeMs,
      ]
    );

    res.json({
      gameId,
      playerName,
      choices: buildChoicesQueens(seq.total),
      algorithms: [
        { name: "Sequential", totalSolutions: seq.total, timeMs: seq.timeMs },
        {
          name: "Threaded (Worker Threads)",
          totalSolutions: thr.total,
          timeMs: thr.timeMs,
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { gameId, playerName, choice, solutionPattern } = req.body;

    if (!gameId || !playerName || choice === undefined)
      return res.status(400).json({ error: "Missing fields" });

    const [[game]] = await db.execute(
      "SELECT * FROM games WHERE id = ?",
      [gameId]
    );
    if (!game) return res.status(404).json({ error: "Game not found" });

    const cfg = JSON.parse(game.config_json);
    const totalSolutions = cfg.totalSolutions;
    const solutionSigs = cfg.solutionSigs;

    const outcome = outcomeForQueens(Number(choice), totalSolutions);

    let solutionStatus = "none";
    let allRecognised = false;

    if (solutionPattern) {
      const parsed = parseSolutionPattern(solutionPattern);
      if (!parsed) solutionStatus = "invalid";
      else {
        const sig = solutionToSig(parsed);
        if (!solutionSigs.includes(sig)) solutionStatus = "invalid";
        else {
          const [[cycleRow]] = await db.execute(
            "SELECT COALESCE(MAX(cycle_number),1) AS c FROM queens_solution_claims"
          );
          let cycle = cycleRow.c;

          const [exists] = await db.execute(
            "SELECT 1 FROM queens_solution_claims WHERE cycle_number=? AND solution_sig=?",
            [cycle, sig]
          );

          if (exists.length) solutionStatus = "already_recognised";
          else {
            solutionStatus = "new";
            await db.execute(
              `INSERT INTO queens_solution_claims (cycle_number, solution_sig, player_name)
               VALUES (?, ?, ?)`,
              [cycle, sig, playerName]
            );

            const [[cnt]] = await db.execute(
              "SELECT COUNT(DISTINCT solution_sig) AS n FROM queens_solution_claims WHERE cycle_number=?",
              [cycle]
            );

            if (cnt.n >= totalSolutions) {
              allRecognised = true;
              await db.execute(
                "INSERT INTO queens_solution_claims (cycle_number, solution_sig, player_name) VALUES (?, 'RESET', 'SYSTEM')",
                [cycle + 1]
              );
            }
          }
        }
      }
    }

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, answer_json) VALUES (?, ?, ?)",
        [
          gameId,
          playerName,
          JSON.stringify({ choice, totalSolutions }),
        ]
      );
    }

    res.json({
      gameId,
      playerName,
      choice,
      correctTotal: totalSolutions,
      outcome,
      solutionStatus,
      allRecognised,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
