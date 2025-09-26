import { z } from 'zod';
import { env } from '../utils/env.js';
import { ChatOpenAI } from '@langchain/openai';

const Difficulty = z.enum(['Easy','Intermediate','Advanced']);
const GeneratedQuestionSchema = z.object({
  question: z.string(),
  difficulty: Difficulty,
  rationale: z.string()
});
const GenerateQuestionsResSchema = z.object({
  items: z.array(GeneratedQuestionSchema).min(1)
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsResSchema>;

export async function generateQuestions(input: {
  role: string;
  seniority: string;
  techStack?: string[];
  count?: number;
  options?: { temperature?: number; language?: 'en'|'es' };
}): Promise<GenerateQuestionsOutput> {
  const count = Math.max(1, Math.min(10, input.count ?? 6));
  const system = [
    'You are an interview designer creating practical, non-trivia questions.',
    'Return ONLY strict JSON with key "items" as an array of {question, difficulty, rationale}.',
    'Difficulty must be "Easy", "Intermediate", or "Advanced".',
    `Language: ${input.options?.language ?? 'en'}`
  ].join(' ');

  const user = {
    instruction: `Generate ${count} questions for a ${input.seniority} ${input.role} focusing on ${ (input.techStack ?? []).join(', ') }.`,
    mix: 'Include a balanced mix of difficulties and avoid duplicates. Focus on practical scenarios.',
    format: {
      type: 'json',
      schema: {
        items: [
          { question: 'string', difficulty: '"Easy"|"Intermediate"|"Advanced"', rationale: 'string' }
        ]
      }
    }
  };

  const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    temperature: input.options?.temperature ?? Number(process.env.LLM_TEMPERATURE_QUESTIONS || '0.7'),
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
  return GenerateQuestionsResSchema.parse(json);
}
