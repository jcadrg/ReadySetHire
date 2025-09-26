import { api } from "../lib/fetchJson";
import type {
  Applicant,
  ApplicantCreate,
  ApplicantUpdate,
} from "../types/applicant";

/** GET /applicant — list all, optionally filter by interview_id */
export async function listApplicants(interviewId?: number): Promise<Applicant[]> {
  const path = interviewId ? `/applicant?interview_id=eq.${interviewId}` : "/applicant";
  return api.get<Applicant[]>(path);
}

/** POST /applicant — create */
export async function createApplicant(payload: ApplicantCreate): Promise<Applicant> {
  return api.post<Applicant>("/applicant", payload);
}

/** PATCH /applicant?id=eq.<id> — update (PostgREST-style) */
export async function updateApplicant(id: number, changes: ApplicantUpdate): Promise<Applicant[]> {
  // If your server returns a single object, change the return type to Applicant
  return api.patch<Applicant[]>(`/applicant?id=eq.${id}`, changes);
}

/** DELETE /applicant?id=eq.<id> — delete */
export async function deleteApplicant(id: number): Promise<void> {
  await api.del(`/applicant?id=eq.${id}`);
}
