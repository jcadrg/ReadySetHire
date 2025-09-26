// PostgREST Applicant Answer API
import { api } from "../lib/fetchJson";
import type { ApplicantAnswer, ApplicantAnswerCreate } from "../types/applicantAnswer";

export async function listAnswersByApplicant(applicantId: number) {
  return api.get<ApplicantAnswer[]>(`/applicant_answer?applicant_id=eq.${applicantId}`);
}

export async function createAnswer(input: ApplicantAnswerCreate) {
  await api.post("/applicant_answer", input);
}
