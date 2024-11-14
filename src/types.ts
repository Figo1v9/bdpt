// file: types.ts
export interface Question {
  id: string;
  text: string;
  subject: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  created_at?: string;
}
