export interface Student {
  id: string;
  name: string;
  examResults: ExamResult[];
}

export interface ExamResult {
  subjectId: string;
  score: number;
  date: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Subject {
  id: string;
  name: string;
  questions: Question[];
  timeLimit: number;
}