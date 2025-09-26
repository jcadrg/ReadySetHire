// PostgREST Questions API client
// Depends on your existing lib/fetchJson.ts
import { api } from "../lib/fetchJson";
import type { Question, QuestionCreate, QuestionUpdate } from "../types/question";

// GET /question?interview_id=eq.{id}
export async function listQuestions(interviewId: number): Promise<Question[]> {
  const path = `/question?interview_id=eq.${interviewId}`;
  return api.get<Question[]>(path);
}

// POST /question  (no Prefer header; we refresh UI afterwards)
export async function createQuestion(input: QuestionCreate): Promise<void> {
  const path = `/question`;
  await api.post(path, input);
}

// PATCH /question?id=eq.{id}  (no Prefer header; we refresh UI afterwards)
export async function updateQuestion(id: number, changes: QuestionUpdate): Promise<void> {
  const path = `/question?id=eq.${id}`;
  await api.patch(path, changes);
}

// DELETE /question?id=eq.{id}
export async function deleteQuestion(id: number): Promise<void> {
  const path = `/question?id=eq.${id}`;
  await api.delete(path);
}
