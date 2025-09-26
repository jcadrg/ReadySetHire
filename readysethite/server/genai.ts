// server/genai.ts
import express from "express";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai"; // npm i @langchain/openai
import { PromptTemplate } from "@langchain/core/prompts";

const router = express.Router();

// -- Config --
const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
const TEMPERATURE_QUESTIONS = Number(process.env.LLM_TEMPERATURE_QUESTIONS ?? 0.7);
const TEMPERATURE_SUMMARY = Number(process.env.LLM_TEMPERATURE_SUMMARY ?? 0.2);

// Simple guard
function requireKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }
}

// 1) SUGGEST QUESTIONS ------------------------------------------
const SuggestBody = z.object({
  jobRole: z.string().min(2),
  description: z.string().default(""),
  count: z.number().int().min(1).max(10).default(5),
  difficulty: z.enum(["Easy", "Intermediate", "Advanced"]).default("Intermediate"),
});

router.post("/suggest-questions", async (req, res) => {
  try {
    requireKey();
    const body = SuggestBody.parse(req.body);

    const llm = new ChatOpenAI({ model: MODEL, temperature: TEMPERATURE_QUESTIONS });

    const prompt = PromptTemplate.fromTemplate(`
You are helping a recruiter draft concise technical interview questions.
Role: {role}
Context: {description}
Difficulty: {difficulty}
Generate {count} clear, single-sentence questions. Output JSON array of strings only.
`);

    const chain = prompt.pipe(llm);
    const out = await chain.invoke({
      role: body.jobRole,
      description: body.description,
      difficulty: body.difficulty,
      count: String(body.count),
    });

    // try parse JSON array
    let questions: string[] = [];
    try {
      const text = out.content?.toString() ?? "[]";
      questions = JSON.parse(text);
    } catch {
      // fallback: split lines
      const text = out.content?.toString() ?? "";
      questions = text.split("\n").map(s => s.replace(/^\d+[\).\s-]*/, "").trim()).filter(Boolean);
    }

    res.json({ questions });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Bad Request" });
  }
});

// 2) SUMMARIZE ANSWERS -------------------------------------------
const SummaryBody = z.object({
  jobRole: z.string().min(2),
  answers: z.array(z.object({
    question: z.string(),
    answer: z.string().nullable(), // may be null if blank
  })).min(1),
});

router.post("/summarize-answers", async (req, res) => {
  try {
    requireKey();
    const body = SummaryBody.parse(req.body);

    const llm = new ChatOpenAI({ model: MODEL, temperature: TEMPERATURE_SUMMARY });

    const prompt = PromptTemplate.fromTemplate(`
You are writing a concise recruiter-facing summary of an applicant's interview.
Role: {role}
Provide:
- 3-5 bullet point strengths
- 2-4 areas to probe or concerns
- A single paragraph overall recommendation (Yes/Leaning Yes/Neutral/Leaning No/No)
Use neutral, professional tone. Base strictly on provided Q&A.

Q&A:
{qa}
`);

    const qaBlock = body.answers.map((a, i) =>
      `Q${i+1}: ${a.question}\nA${i+1}: ${a.answer ?? "(no answer provided)"}`
    ).join("\n\n");

    const chain = prompt.pipe(llm);
    const out = await chain.invoke({ role: body.jobRole, qa: qaBlock });

    res.json({ summary: out.content?.toString() ?? "" });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Bad Request" });
  }
});

export default router;
