// TypeScript interfaces + enums for Interview
export type InterviewStatus = "Published" | "Draft" | "Archived";

export interface Interview {
  id: number;
  title: string;
  job_role: string;
  description?: string | null;
  status: InterviewStatus;
  username: string; // owner (student id)
}

export interface InterviewCreate {
  title: string;
  job_role: string;
  status: InterviewStatus;
  username: string;
  description?: string | null;
}

export type InterviewUpdate = Partial<
  Pick<Interview, "title" | "job_role" | "status" | "description">
>;
