import { Router } from 'express';
import { z } from 'zod';
import { summarizeApplicant } from '../langchain/summarizeApplicant.js';
import { generateQuestions } from '../langchain/generateQuestions.js';

const router = Router();

// ---------- Schemas ----------
const AnswerSchema = z.object({
  question: z.string().min(1),
  transcript: z.string().min(1),
});

const SummarizeReqSchema = z.object({
  role: z.string().min(1),
  seniority: z.string().min(1),
  skillsHint: z.array(z.string()).optional(),
  answers: z.array(AnswerSchema).min(1),
  options: z.object({
    maxCharsPerAnswer: z.number().int().positive().max(5000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    language: z.enum(['en','es']).optional()
  }).optional()
});

const SummarizeResSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  overall_signal: z.enum(['Proceed','Maybe','Pass']),
});

router.post('/summarize-applicant', async (req, res) => {
  try {
    const input = SummarizeReqSchema.parse(req.body);
    const result = await summarizeApplicant(input);
    const parsed = SummarizeResSchema.parse(result);
    res.json(parsed);
  } catch (err) {
    console.error('[summarize-applicant] error:', err);
    if ((err as any)?.issues) {
      return res.status(400).json({ error: { code: 'bad_request', message: 'Validation failed', details: (err as any).issues } });
    }
    res.status(500).json({ error: { code: 'genai_error', message: (err as Error).message || 'Unknown error' } });
  }
});

// ---- Generate Questions ----
const Difficulty = z.enum(['Easy','Intermediate','Advanced']);
const GenerateQuestionsReqSchema = z.object({
  role: z.string().min(1),
  seniority: z.string().min(1),
  techStack: z.array(z.string()).default([]),
  count: z.number().int().positive().max(10).default(6),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    language: z.enum(['en','es']).optional()
  }).optional()
});

const GeneratedQuestionSchema = z.object({
  question: z.string().min(1),
  difficulty: Difficulty,
  rationale: z.string().min(1)
});

const GenerateQuestionsResSchema = z.object({
  items: z.array(GeneratedQuestionSchema).min(1)
});

router.post('/generate-questions', async (req, res) => {
  try {
    const input = GenerateQuestionsReqSchema.parse(req.body);
    const result = await generateQuestions(input);
    const parsed = GenerateQuestionsResSchema.parse(result);
    res.json(parsed);
  } catch (err) {
    console.error('[generate-questions] error:', err);
    if ((err as any)?.issues) {
      return res.status(400).json({ error: { code: 'bad_request', message: 'Validation failed', details: (err as any).issues } });
    }
    res.status(500).json({ error: { code: 'genai_error', message: (err as Error).message || 'Unknown error' } });
  }
});

export default router;
