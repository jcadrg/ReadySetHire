export interface ApplicantAnswer {
  id: number;
  interview_id: number;
  question_id: number;
  applicant_id: number;
  answer: string | null;
  username: string;
}

export interface ApplicantAnswerCreate {
  interview_id: number;
  question_id: number;
  applicant_id: number;
  answer: string | null;
  username: string;
}
