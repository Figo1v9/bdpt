import Database from 'better-sqlite3';
import { join } from 'path';
import type { Question, ExamResult } from '../types';

// Create database in the project root directory
const db = new Database(join(process.cwd(), 'exam.db'));

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize database with better schema
db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    subject_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_spent INTEGER NOT NULL,
    answers TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
  CREATE INDEX IF NOT EXISTS idx_results_user ON exam_results(username);
  CREATE INDEX IF NOT EXISTS idx_results_subject ON exam_results(subject_id);
`);

// Insert default subjects if they don't exist
const defaultSubjects = [
  'Business Management',
  'Economics',
  'Financial Accounting',
  'English',
  'Law'
];

const insertSubject = db.prepare('INSERT OR IGNORE INTO subjects (name) VALUES (?)');
defaultSubjects.forEach(subject => insertSubject.run(subject));

// Prepared statements for better performance
const getSubjectId = db.prepare('SELECT id FROM subjects WHERE name = ?');
const insertQuestion = db.prepare(`
  INSERT INTO questions (subject_id, text, options, correct_answer, explanation)
  VALUES (@subject_id, @text, @options, @correct_answer, @explanation)
`);
const getAllQuestions = db.prepare(`
  SELECT q.*, s.name as subject
  FROM questions q
  JOIN subjects s ON q.subject_id = s.id
  ORDER BY q.created_at DESC
`);
const getQuestionsBySubject = db.prepare(`
  SELECT q.*, s.name as subject
  FROM questions q
  JOIN subjects s ON q.subject_id = s.id
  WHERE s.name = ?
  ORDER BY q.created_at DESC
`);

export const questionsApi = {
  async getQuestions(subject?: string): Promise<Question[]> {
    try {
      const questions = subject 
        ? getQuestionsBySubject.all(subject)
        : getAllQuestions.all();

      return questions.map(q => ({
        id: q.id.toString(),
        subject: q.subject,
        text: q.text,
        options: JSON.parse(q.options),
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        created_at: q.created_at
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  },

  async addQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question | null> {
    try {
      const subjectResult = getSubjectId.get(question.subject);
      if (!subjectResult) {
        throw new Error(`Subject "${question.subject}" not found`);
      }

      const result = insertQuestion.run({
        subject_id: subjectResult.id,
        text: question.text,
        options: JSON.stringify(question.options),
        correct_answer: question.correctAnswer,
        explanation: question.explanation || null
      });

      if (result.changes === 0) {
        throw new Error('Failed to insert question');
      }

      return {
        id: result.lastInsertRowid.toString(),
        ...question,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding question:', error);
      return null;
    }
  },

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const result = db.prepare('DELETE FROM questions WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }
};

const insertResult = db.prepare(`
  INSERT INTO exam_results (
    username, subject_id, score, total_questions, 
    time_spent, answers
  )
  VALUES (
    @username, @subject_id, @score, @total_questions,
    @time_spent, @answers
  )
`);

const getAllResults = db.prepare(`
  SELECT r.*, s.name as subject
  FROM exam_results r
  JOIN subjects s ON r.subject_id = s.id
  ORDER BY r.completed_at DESC
`);

export const resultsApi = {
  async saveResult(result: Omit<ExamResult, 'id'>): Promise<ExamResult | null> {
    try {
      const subjectResult = getSubjectId.get(result.subject);
      if (!subjectResult) {
        throw new Error(`Subject "${result.subject}" not found`);
      }

      const examResult = insertResult.run({
        username: result.username,
        subject_id: subjectResult.id,
        score: result.score,
        total_questions: result.questions.length,
        time_spent: result.timeSpent,
        answers: JSON.stringify({
          questions: result.questions,
          userAnswers: result.userAnswers
        })
      });

      if (examResult.changes === 0) {
        throw new Error('Failed to save exam result');
      }

      return {
        id: examResult.lastInsertRowid.toString(),
        ...result,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error saving result:', error);
      return null;
    }
  },

  async getResults(): Promise<ExamResult[]> {
    try {
      const results = getAllResults.all();
      return results.map(r => {
        const answers = JSON.parse(r.answers);
        return {
          id: r.id.toString(),
          username: r.username,
          subject: r.subject,
          score: r.score,
          date: r.completed_at,
          timeSpent: r.time_spent,
          questions: answers.questions,
          userAnswers: answers.userAnswers,
          created_at: r.completed_at
        };
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      return [];
    }
  }
};