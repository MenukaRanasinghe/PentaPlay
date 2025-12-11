import express from "express";
import db from "../db/connection.js";
import {
  solveEightQueensSequential,
  solveEightQueensThreadedStyle,
  solutionToSig,
  buildChoicesQueens,
  outcomeForQueens,
  parseSolutionPattern,
} from "../logic/eightQueens.js";

const router = express.Router();

router.post("/new-game", async (req, res) => {
  try {
    const { playerName } = req.body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return res.status(400).json({ error: "playerName is required" });
    }

    const seq = solveEightQueensSequential();

    const thr = solveEightQueensThreadedStyle();

    if (seq.total !== thr.total) {
      console.error(
        "❌ EightQueens mismatch between sequential and threaded-style:",
        seq.total,
        thr.total
      );
      return res.status(500).json({ error: "Solver mismatch" });
    }

    const totalSolutions = seq.total; 

    const solutionSigs = seq.solutions.map((sol) => solutionToSig(sol));

    const [gameResult] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      [
        "Eight Queens",
        JSON.stringify({
          boardSize: 8,
          totalSolutions,
          solutionSigs,
        }),
      ]
    );
    const gameId = gameResult.insertId;

    await db.execute(
      `INSERT INTO algorithm_runs 
       (game_id, algorithm_name, metric_name, metric_value, time_ms)
       VALUES
       (?, ?, ?, ?, ?),
       (?, ?, ?, ?, ?)`,
      [
        gameId,
        "Sequential Backtracking",
        "total_solutions",
        totalSolutions,
        seq.timeMs,

        gameId,
        "Threaded-style Backtracking",
        "total_solutions",
        totalSolutions,
        thr.timeMs,
      ]
    );

    const choices = buildChoicesQueens(totalSolutions);

    console.log("♕ New Eight Queens game:", {
      gameId,
      playerName,
      totalSolutions,
      choices,
    });

    return res.json({
      gameId,
      playerName,
      boardSize: 8,
      choices,
      algorithms: [
        {
          name: "Sequential Backtracking",
          totalSolutions,
          timeMs: seq.timeMs,
        },
        {
          name: "Threaded-style Backtracking",
          totalSolutions,
          timeMs: thr.timeMs,
        },
      ],
    });
  } catch (err) {
    console.error("💥 Error in /eight-queens/new-game:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { gameId, playerName, choice, solutionPattern } = req.body;

    if (!gameId || !playerName || choice === undefined) {
      return res
        .status(400)
        .json({ error: "gameId, playerName and choice are required" });
    }

    const guess = Number(choice);
    if (Number.isNaN(guess)) {
      return res.status(400).json({ error: "choice must be a number" });
    }

    const [[game]] = await db.execute("SELECT * FROM games WHERE id = ?", [
      gameId,
    ]);
    if (!game) return res.status(404).json({ error: "Game not found" });

    const cfg =
      typeof game.config_json === "string"
        ? JSON.parse(game.config_json)
        : game.config_json;

    const totalSolutions = cfg.totalSolutions;
    const solutionSigs = cfg.solutionSigs || [];

    const outcome = outcomeForQueens(guess, totalSolutions);

    let solutionStatus = "none"; 
    let allRecognised = false;

    let parsedSolution = null;
    let playerSolutionSig = null;
    if (solutionPattern && typeof solutionPattern === "string") {
      parsedSolution = parseSolutionPattern(solutionPattern);
      if (!parsedSolution) {
        solutionStatus = "invalid";
      } else {
        playerSolutionSig = solutionToSig(parsedSolution);
        if (!solutionSigs.includes(playerSolutionSig)) {
          solutionStatus = "invalid";
        } else {
         
          const [rows] = await db.execute(
            "SELECT COALESCE(MAX(cycle_number), 1) AS currentCycle FROM queens_solution_claims"
          );
          let currentCycle = rows[0].currentCycle || 1;

          const [existing] = await db.execute(
            "SELECT * FROM queens_solution_claims WHERE cycle_number = ? AND solution_sig = ?",
            [currentCycle, playerSolutionSig]
          );

          if (existing.length > 0) {
            solutionStatus = "already_recognised";
          } else {
            solutionStatus = "new";
            await db.execute(
              `INSERT INTO queens_solution_claims 
               (cycle_number, solution_sig, player_name) 
               VALUES (?, ?, ?)`,
              [currentCycle, playerSolutionSig, playerName]
            );

            const [cntRows] = await db.execute(
              "SELECT COUNT(DISTINCT solution_sig) AS cnt FROM queens_solution_claims WHERE cycle_number = ?",
              [currentCycle]
            );
            const countRecognised = cntRows[0].cnt;
            if (countRecognised >= totalSolutions) {
              allRecognised = true;
            }
          }
        }
      }
    }

    console.log("♕ Eight Queens submit:", {
      gameId,
      playerName,
      guess,
      totalSolutions,
      outcome,
      solutionStatus,
      playerSolutionSig,
      allRecognised,
    });

    if (outcome === "win") {
      await db.execute(
        "INSERT INTO correct_answers (game_id, player_name, answer_json) VALUES (?, ?, ?)",
        [
          gameId,
          playerName,
          JSON.stringify({
            totalSolutions,
            guessed: guess,
            solutionSig: playerSolutionSig,
            solutionStatus,
          }),
        ]
      );
    }

    return res.json({
      gameId,
      playerName,
      choice: guess,
      correctTotal: totalSolutions,
      outcome,
      solutionStatus,
      allRecognised,
    });
  } catch (err) {
    console.error("💥 Error in /eight-queens/submit:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
