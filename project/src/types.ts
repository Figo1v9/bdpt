export interface Question {
  id: string;
  subject: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface User {
  username: string;
  role: 'student' | 'admin';
}

export interface ExamResult {
  username: string;
  subject: string;
  score: number;
  date: string;
  timeSpent: number;
  answers: number[];
  questions: Question[];
}