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
    if (!playerName?.trim()) {
      return res.status(400).json({ error: "playerName required" });
    }

    const [[cycleRow]] = await db.execute(
      "SELECT COALESCE(MAX(cycle_number),1) AS c FROM queens_solution_claims"
    );
    const cycle = cycleRow.c;

    const [claimedRows] = await db.execute(
      "SELECT solution_sig FROM queens_solution_claims WHERE cycle_number=?",
      [cycle]
    );

    const claimedSigs = new Set(
      claimedRows.map(r => r.solution_sig)
    );

    const seq = solveEightQueensSequential();
    const thr = await solveEightQueensThreaded();

    if (seq.total !== thr.total) {
      throw new Error("Sequential / Threaded mismatch");
    }

    const example = seq.solutions.find(
      sol => !claimedSigs.has(solutionToSig(sol))
    );

    if (example) {
      console.log("♕ Example Correct Eight Queens Solution:");
      example.forEach((col, row) => {
        console.log(`Row ${row + 1} → Column ${col + 1}`);
      });
      console.log(
        "Pattern to submit:",
        example.map(c => c + 1).join(",")
      );
    } else {
      console.log("♕ All solutions already claimed in this cycle.");
    }

    const solutionSigs = seq.solutions.map(solutionToSig);

    const algoTimes = {
      Sequential: seq.timeMs,
      "Threaded (Worker Threads)": thr.timeMs,
    };

    const [game] = await db.execute(
      "INSERT INTO games (game_name, config_json) VALUES (?, ?)",
      [
        "Eight Queens",
        JSON.stringify({
          boardSize: 8,
          totalSolutions: seq.total,
          solutionSigs,
          algoTimes,
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

    if (!gameId || !playerName)
      return res.status(400).json({ error: "Missing fields" });



    const [[game]] = await db.execute(
      "SELECT * FROM games WHERE id = ?",
      [gameId]
    );
    if (!game) return res.status(404).json({ error: "Game not found" });

    const cfg =
      typeof game.config_json === "string"
        ? JSON.parse(game.config_json)
        : game.config_json;
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
        console.log("♕ Eight Queens Solution Submitted:");
        parsed.forEach((col, row) => {
          console.log(`Row ${row + 1} → Column ${col + 1}`);
        });

        console.log("Signature:", sig);

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

    const isChoiceWin =
      choice !== undefined &&
      Number(choice) === totalSolutions;

    const isBoardWin = solutionStatus === "new";

    if (isChoiceWin || isBoardWin) {
      const { algoTimes } = cfg;

      await db.execute(
        `INSERT INTO eight_queens_results
     (game_id, player_name, board_size,
      correct_total, player_choice,
      seq_time_ms, threaded_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          playerName,
          8,
          totalSolutions,
          isChoiceWin ? Number(choice) : null,
          algoTimes["Sequential"],
          algoTimes["Threaded (Worker Threads)"],
        ]
      );
    }





    res.json({
      status:
        solutionStatus === "new"
          ? "correct"
          : solutionStatus === "already_recognised"
            ? "already_recognised"
            : solutionStatus === "invalid"
              ? "invalid"
              : "error",

      message:
        solutionStatus === "new"
          ? "New valid solution accepted!"
          : solutionStatus === "already_recognised"
            ? "This solution was already recognized. Try another."
            : "Invalid solution.",

      found: allRecognised ? totalSolutions : undefined,
      total: totalSolutions,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }

  try {
    const seq = solveEightQueensSequential();

    const [[cycleRow]] = await db.execute(
      "SELECT COALESCE(MAX(cycle_number),1) AS c FROM queens_solution_claims"
    );
    const cycle = cycleRow.c;

    const [claimedRows] = await db.execute(
      "SELECT solution_sig FROM queens_solution_claims WHERE cycle_number=?",
      [cycle]
    );

    const claimedSigs = new Set(
      claimedRows.map(r => r.solution_sig)
    );

    const nextExample = seq.solutions.find(
      sol => !claimedSigs.has(solutionToSig(sol))
    );

    if (!nextExample) {
      console.log("♕ All Eight Queens solutions already recognised for this cycle.");
    } else {
      console.log("♕ Next Available Eight Queens Solution:");
      nextExample.forEach((col, row) => {
        console.log(`Row ${row + 1} → Column ${col + 1}`);
      });
      console.log(
        "Pattern to submit:",
        nextExample.map(c => c + 1).join(",")
      );
    }
  } catch (e) {
    console.error("Failed to compute next solution:", e.message);
  }

});

export default router;
