export type Difficulty = "Easy" | "Intermediate" | "Advanced";

export interface Question {
  id: number;
  interview_id: number;
  question: string;
  difficulty: Difficulty;
  username: string;
}

export interface QuestionCreate {
  interview_id: number;
  question: string;
  difficulty: Difficulty;
  username: string;
}

export interface QuestionUpdate {
  question?: string;
  difficulty?: Difficulty;
  username?: string;
}
