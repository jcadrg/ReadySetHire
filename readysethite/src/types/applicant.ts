export type ApplicantStatus = "Not Started" | "Completed";

export interface Applicant {
  id: number;
  interview_id: number;
  title: string;
  firstname: string;
  surname: string;
  phone_number: string | null;
  email_address: string;
  interview_status: ApplicantStatus;
  username: string; // owner
}

export interface ApplicantCreate {
  interview_id: number;
  title: string;
  firstname: string;
  surname: string;
  phone_number?: string | null;
  email_address: string;
  interview_status: ApplicantStatus;
  username: string;
}

export type ApplicantUpdate = Partial<
  Omit<Applicant, "id" | "interview_id" | "username">
>;
