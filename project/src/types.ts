export interface User {
  username: string;
  role: 'admin' | 'student';
}

export interface Question {
  id: string;
  text: string;
  subject: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  created_at?: string;
}

export interface ExamResult {
  id?: string;
  username: string;
  subject: string;
  score: number;
  timeSpent: number;
  date: string;
  questions: Question[];
  userAnswers: number[];
  created_at?: string;
}