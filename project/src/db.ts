import { Question, ExamResult } from './types';

const DB_KEYS = {
  QUESTIONS: 'exam_questions',
  RESULTS: 'exam_results',
} as const;

export const saveQuestions = (questions: Question[]): void => {
  localStorage.setItem(DB_KEYS.QUESTIONS, JSON.stringify(questions));
};

export const getQuestions = (): Question[] => {
  const questions = localStorage.getItem(DB_KEYS.QUESTIONS);
  return questions ? JSON.parse(questions) : [];
};

export const saveResults = (results: ExamResult[]): void => {
  localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(results));
};

export const getResults = (): ExamResult[] => {
  const results = localStorage.getItem(DB_KEYS.RESULTS);
  return results ? JSON.parse(results) : [];
};

export const clearDatabase = (): void => {
  localStorage.clear();
};