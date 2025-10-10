// server/src/transcribe.ts
import { Router, type Request, type Response } from "express";
import multer from "multer";

// --- Uncomment these when enabling real STT ---
// import OpenAI from "openai";
// import { createReadStream } from "node:fs";
// import fs from "node:fs/promises";
// import path from "node:path";
// import os from "node:os";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Default = use stub so your demo works without model access.
// Set USE_STUB_TRANSCRIBE=false in server/.env to switch to real STT.
const USE_STUB = process.env.USE_STUB_TRANSCRIBE !== "false";

/**
 * POST /transcribe
 * FormData field name must be "audio".
 */
router.post("/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    // ---- STUB (default) ----
    if (USE_STUB) {
      return res.json({ text: "Sample transcript (stub) — replace with real STT later." });
    }

    // ---- REAL STT (requires model access; uncomment imports above) ----
    /*
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "OPENAI_API_KEY missing" });
    if (!req.file) return res.status(400).json({ error: "No audio file" });

    const openai = new OpenAI({ apiKey });

    // Write buffer to a temp file then stream to OpenAI
    const ext = (req.file.originalname?.split(".").pop() || "webm").toLowerCase();
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}-audio.${ext}`);
    await fs.writeFile(tmpPath, req.file.buffer);

    try {
      const tr = await openai.audio.transcriptions.create({
        // Use a model your project actually has access to (e.g. "whisper-1")
        model: "whisper-1",
        file: createReadStream(tmpPath),
      });
      return res.json({ text: (tr as any).text ?? "" });
    } finally {
      await fs.unlink(tmpPath).catch(() => {});
    }
    */

    // If the block above is still commented:
    return res.status(501).json({ error: "Real transcription disabled. Set USE_STUB_TRANSCRIBE=false and uncomment code." });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Transcription failed" });
  }
});

export default router;
