import express from "express";
import cors from "cors";
import snakeLadderRoute from "./routes/snakeLadder.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/snake-ladder", snakeLadderRoute);

app.use((err, req, res, next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: "Unexpected error" });
});

app.listen(5000, () => console.log("✅ Backend on http://localhost:5000"));
