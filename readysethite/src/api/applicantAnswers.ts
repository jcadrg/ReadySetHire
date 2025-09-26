import { api } from "../lib/fetchJson";
import type {
  ApplicantAnswer,
  ApplicantAnswerCreate,
  ApplicantAnswerUpdate,
} from "../types/applicantAnswer";

/** GET /applicant_answer — list all (filterable by applicant_id) */
export async function listApplicantAnswers(
  applicantId?: number
): Promise<ApplicantAnswer[]> {
  const path = applicantId
    ? `/applicant_answer?applicant_id=eq.${applicantId}`
    : "/applicant_answer";
  return api.get<ApplicantAnswer[]>(path);
}

/** POST /applicant_answer — create */
export async function createApplicantAnswer(
  payload: ApplicantAnswerCreate
): Promise<ApplicantAnswer> {
  return api.post<ApplicantAnswer>("/applicant_answer", payload);
}

/** PATCH /applicant_answer?id=eq.<id> — update */
export async function updateApplicantAnswer(
  id: number,
  changes: ApplicantAnswerUpdate
): Promise<ApplicantAnswer[]> {
  return api.patch<ApplicantAnswer[]>(`/applicant_answer?id=eq.${id}`, changes);
}

/** DELETE /applicant_answer?id=eq.<id> — delete */
export async function deleteApplicantAnswer(id: number): Promise<void> {
  await api.del(`/applicant_answer?id=eq.${id}`);
}
