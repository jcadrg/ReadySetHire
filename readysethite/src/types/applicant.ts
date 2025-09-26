export type ApplicantInterviewStatus = "Not Started" | "Completed";

export interface Applicant {
  id: number;
  interview_id: number;
  title: "Mr" | "Ms" | "Dr" | string; // keep open-ended if backend allows others
  firstname: string;
  surname: string;
  phone_number?: string | null;        // optional per spec
  email_address: string;
  interview_status: ApplicantInterviewStatus;
  username: string;                    // owner (student id)
}

export interface ApplicantCreate {
  interview_id: number;
  title: Applicant["title"];
  firstname: string;
  surname: string;
  email_address: string;
  interview_status: ApplicantInterviewStatus;
  username: string;
  phone_number?: string | null;
}

export type ApplicantUpdate = Partial<
  Pick<
    Applicant,
    | "title"
    | "firstname"
    | "surname"
    | "phone_number"
    | "email_address"
    | "interview_status"
  >
>;
