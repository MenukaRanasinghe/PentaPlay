import express from "express";
import cors from "cors";
import snakeLadderRoute from "./routes/snakeLadder.js";
import trafficRouter from "./routes/trafficSimulation.js";
import tspRouter from "./routes/travellingSalesman.js";
import hanoiRouter from "./routes/towerHanoi.js";
import eightQueensRouter from "./routes/eightQueens.js";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/snake-ladder", snakeLadderRoute);
app.use("/traffic-simulation", trafficRouter);
app.use("/travelling-salesman", tspRouter);
app.use("/tower-hanoi", hanoiRouter);
app.use("/eight-queens", eightQueensRouter);

app.use((err, req, res, next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: "Unexpected error" });
});

app.listen(5000, () => {
  console.log("✅ Backend on http://localhost:5000");
});
