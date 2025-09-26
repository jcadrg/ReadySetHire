// API calls for /interview endpoints (list, create, update, delete)
import { api } from "../lib/fetchJson";
import type {
  Interview,
  InterviewCreate,
  InterviewUpdate,
} from "../types/interview";

/** GET /interview — list all interviews */
export async function listInterviews(): Promise<Interview[]> {
  return api.get<Interview[]>("/interview");
}

/** POST /interview — create a new interview */
export async function createInterview(
  payload: InterviewCreate
): Promise<Interview> {
  return api.post<Interview>("/interview", payload);
}

/** PATCH /interview?id=eq.<id> — update interview by id (PostgREST style filtering) */
export async function updateInterview(
  id: number,
  changes: InterviewUpdate
): Promise<Interview[]> {
  // PostgREST PATCH typically returns an array of updated rows unless `Prefer: return=representation` differs
  // If your server returns a single object, change the return type to Interview
  return api.patch<Interview[]>(`/interview?id=eq.${id}`, changes);
}

/** DELETE /interview?id=eq.<id> — delete interview by id */
export async function deleteInterview(id: number): Promise<void> {
  await api.del(`/interview?id=eq.${id}`);
}
