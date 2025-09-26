export interface ApplicantAnswer {
  id: number;
  interview_id: number;
  question_id: number;
  applicant_id: number;
  answer?: string | null; // can be empty if transcription not ready
  username: string; // owner of the record
}

export interface ApplicantAnswerCreate {
  interview_id: number;
  question_id: number;
  applicant_id: number;
  answer?: string | null;
  username: string;
}

export type ApplicantAnswerUpdate = Partial<Pick<ApplicantAnswer, "answer">>;
