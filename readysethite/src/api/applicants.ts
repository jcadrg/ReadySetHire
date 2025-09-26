import { api } from "../lib/fetchJson";
import type { Applicant, ApplicantCreate, ApplicantUpdate } from "../types/applicant";

// GET /applicant?interview_id=eq.{id}
export async function listApplicants(interviewId: number): Promise<Applicant[]> {
  const path = `/applicant?interview_id=eq.${interviewId}`;
  return api.get<Applicant[]>(path);
}

// POST /applicant
export async function createApplicant(input: ApplicantCreate): Promise<void> {
  await api.post("/applicant", input);
}

// PATCH /applicant?id=eq.{id}
export async function updateApplicant(id: number, changes: ApplicantUpdate): Promise<void> {
  await api.patch(`/applicant?id=eq.${id}`, changes);
}

// DELETE /applicant?id=eq.{id}
export async function deleteApplicant(id: number): Promise<void> {
  await api.delete(`/applicant?id=eq.${id}`);
}
