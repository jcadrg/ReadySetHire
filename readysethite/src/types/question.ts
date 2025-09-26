export type QuestionDifficulty = "Easy" | "Intermediate" | "Advanced";

export interface Question {
  id: number;
  interview_id: number;
  question: string;
  difficulty: QuestionDifficulty;
  username: string;
}

export interface QuestionCreate {
  interview_id: number;
  question: string;
  difficulty: QuestionDifficulty;
  username: string;
}

export type QuestionUpdate = Partial<Pick<Question, "question" | "difficulty">>;
