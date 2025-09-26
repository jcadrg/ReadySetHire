import { z } from 'zod';
import { env, envNum } from '../utils/env.js';
import { truncateMiddle } from '../utils/text.js';
import { ChatOpenAI } from '@langchain/openai';

// cache
const TTL = envNum('GENAI_CACHE_TTL_SEC', 0);
const cache = new Map<string, { value: any; exp: number }>();

type OverallSignal = 'Proceed' | 'Maybe' | 'Pass';

const SummarizeSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  overall_signal: z.enum(['Proceed','Maybe','Pass'] as OverallSignal[]),
});

export type SummarizeOutput = z.infer<typeof SummarizeSchema>;

export async function summarizeApplicant(input: {
  role: string;
  seniority: string;
  skillsHint?: string[];
  answers: { question: string; transcript: string }[];
  options?: { maxCharsPerAnswer?: number; temperature?: number; language?: 'en'|'es' };
}): Promise<SummarizeOutput> {
  const maxChars = input.options?.maxCharsPerAnswer ?? Number(process.env.TRANSCRIPT_MAX_CHARS || '1200');
  const compactAnswers = input.answers.map(a => ({
    question: a.question,
    transcript: truncateMiddle(a.transcript, maxChars),
  }));
  const key = JSON.stringify({ role: input.role, seniority: input.seniority, skillsHint: input.skillsHint ?? [], answers: compactAnswers });
  if (TTL > 0) {
    const e = cache.get(key);
    if (e && Date.now() < e.exp) return e.value;
  }

  const system = [
    'You are a neutral, concise technical recruiter.',
    'Summarize the applicant for the specified role and seniority.',
    'Be evidence-based; avoid speculation or personal bias.',
    'Return ONLY strict JSON with keys: summary, strengths, concerns, overall_signal.',
    'overall_signal must be one of: "Proceed", "Maybe", "Pass".',
    `Language: ${input.options?.language ?? 'en'}`
  ].join(' ');

  const user = {
    instruction: 'Produce a 5–7 sentence summary, three strengths, three concerns, and an overall_signal.',
    role: input.role,
    seniority: input.seniority,
    skillsHint: input.skillsHint ?? [],
    answers: compactAnswers,
    format: {
      type: 'json',
      schema: {
        summary: 'string',
        strengths: 'string[3]',
        concerns: 'string[3]',
        overall_signal: '"Proceed" | "Maybe" | "Pass"'
      }
    }
  };

  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    temperature: input.options?.temperature ?? Number(process.env.LLM_TEMPERATURE_SUMMARY || '0.2'),
    apiKey: env('OPENAI_API_KEY')
  });

  const res = await llm.invoke([
    { role: 'system', content: system },
    { role: 'user', content: JSON.stringify(user) }
  ]);

  const text = typeof res.content === 'string'
    ? res.content
    : Array.isArray(res.content) ? res.content.map((p: any) => p?.text ?? '').join('') : '';

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Model did not return valid JSON');
  }
  const out = SummarizeSchema.parse(json);
  if (TTL > 0) cache.set(key, { value: out, exp: Date.now() + TTL * 1000 });
  return out;
}
