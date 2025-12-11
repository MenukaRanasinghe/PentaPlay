import express from "express";
import db from "../db/connection.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { playerName, boardSize } = req.body;
  const start = Date.now();

  const minThrows = Math.ceil(Math.random() * boardSize);
  const timeTaken = (Date.now() - start) / 1000;

  await db.execute(
    "INSERT INTO game_results (player_name, game_name, result, time_taken) VALUES (?, ?, ?, ?)",
    [playerName, "Snake & Ladder", minThrows, timeTaken]
  );

  res.json({ playerName, minThrows, timeTaken });
});

export default router;
