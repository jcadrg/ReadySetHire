import { api } from "../lib/fetchJson";
import type {
  Question,
  QuestionCreate,
  QuestionUpdate,
} from "../types/question";

/** GET /question — list all questions, optionally filter by interview_id */
export async function listQuestions(interviewId?: number): Promise<Question[]> {
  const path = interviewId
    ? `/question?interview_id=eq.${interviewId}`
    : "/question";
  return api.get<Question[]>(path);
}

/** POST /question — create a new question */
export async function createQuestion(
  payload: QuestionCreate
): Promise<Question> {
  return api.post<Question>("/question", payload);
}

/** PATCH /question?id=eq.<id> — update question */
export async function updateQuestion(
  id: number,
  changes: QuestionUpdate
): Promise<Question[]> {
  return api.patch<Question[]>(`/question?id=eq.${id}`, changes);
}

/** DELETE /question?id=eq.<id> — delete question */
export async function deleteQuestion(id: number): Promise<void> {
  await api.del(`/question?id=eq.${id}`);
}
