import "dotenv/config";
import express from "express";
import cors from "cors";
import genaiRouter from "./genai.ts";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/genai", genaiRouter);

// (optional) health probe
app.get("/", (_req, res) => res.send("GenAI server up"));

app.listen(PORT, () => {
  console.log(`GenAI server listening on http://localhost:${PORT}`);
});
