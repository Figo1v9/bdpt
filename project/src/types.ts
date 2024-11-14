export interface Question {
  id: string;
  subject: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  created_at?: string;
}

export interface User {
  username: string;
  role: 'student' | 'admin';
}

export interface ExamResult {
  id: string;
  username: string;
  subject: string;
  score: number;
  date: string;
  timeSpent: number;
  questions: Question[];
  userAnswers: number[];
  created_at?: string;
}