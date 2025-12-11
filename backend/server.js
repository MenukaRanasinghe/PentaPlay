import express from "express";
import cors from "cors";
import snakeLadderRoute from "./routes/snakeLadder.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/snake-ladder", snakeLadderRoute);

app.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));
