// src/api/genai.ts
const BASE = import.meta.env.VITE_GENAI_BASE ?? "http://localhost:8080/genai";

export async function aiSuggestQuestions(input: {
  jobRole: string;
  description?: string;
  difficulty?: "Easy" | "Intermediate" | "Advanced";
  count?: number;
}) {
  const res = await fetch(`${BASE}/suggest-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { questions: string[] };
}

export async function aiSummarizeAnswers(input: {
  jobRole: string;
  answers: { question: string; answer: string | null }[];
}) {
  const res = await fetch(`${BASE}/summarize-answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { summary: string };
}
