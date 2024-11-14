import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Question, ExamResult } from '../types';

const initializeDb = async () => {
  return open({
    filename: './data.db',
    driver: sqlite3.Database
  });
};

const initializeDatabase = async () => {
  const db = await initializeDb();
  
  // Create questions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      subject TEXT NOT NULL,
      options TEXT NOT NULL,
      correctAnswer INTEGER NOT NULL,
      explanation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create exam_results table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      subject TEXT NOT NULL,
      score INTEGER NOT NULL,
      timeSpent INTEGER NOT NULL,
      questions TEXT NOT NULL,
      userAnswers TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.close();
};

// Initialize database on startup
initializeDatabase().catch(console.error);

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const questionsApi = {
  getQuestions: async (): Promise<Question[]> => {
    const db = await initializeDb();
    try {
      const questions = await db.all<Question[]>('SELECT * FROM questions ORDER BY created_at DESC');
      return questions.map(q => ({
        ...q,
        options: JSON.parse(q.options as string)
      }));
    } finally {
      await db.close();
    }
  },

  addQuestion: async (question: Omit<Question, 'id' | 'created_at'>): Promise<Question | null> => {
    const db = await initializeDb();
    try {
      const id = generateId();
      const optionsJson = JSON.stringify(question.options);
      
      await db.run(
        `INSERT INTO questions (id, text, subject, options, correctAnswer, explanation, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, question.text, question.subject, optionsJson, question.correctAnswer, question.explanation]
      );

      const inserted = await db.get<Question>('SELECT * FROM questions WHERE id = ?', [id]);
      return inserted ? {
        ...inserted,
        options: JSON.parse(inserted.options as string)
      } : null;
    } finally {
      await db.close();
    }
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    const db = await initializeDb();
    try {
      await db.run('DELETE FROM questions WHERE id = ?', [id]);
      return true;
    } finally {
      await db.close();
    }
  },

  searchQuestions: async (subject: string, searchTerm: string): Promise<Question[]> => {
    const db = await initializeDb();
    try {
      const questions = await db.all<Question[]>(
        `SELECT * FROM questions 
         WHERE subject = ? 
         AND (text LIKE ? OR options LIKE ?)
         ORDER BY created_at DESC`,
        [subject, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return questions.map(q => ({
        ...q,
        options: JSON.parse(q.options as string)
      }));
    } finally {
      await db.close();
    }
  }
};

export const resultsApi = {
  saveResult: async (result: Omit<ExamResult, 'id'>): Promise<ExamResult | null> => {
    const db = await initializeDb();
    try {
      const id = generateId();
      const questionsJson = JSON.stringify(result.questions);
      const userAnswersJson = JSON.stringify(result.userAnswers);

      await db.run(
        `INSERT INTO exam_results (id, username, subject, score, timeSpent, questions, userAnswers, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, result.username, result.subject, result.score, result.timeSpent, questionsJson, userAnswersJson]
      );

      const inserted = await db.get<ExamResult>('SELECT * FROM exam_results WHERE id = ?', [id]);
      return inserted ? {
        ...inserted,
        questions: JSON.parse(inserted.questions as string),
        userAnswers: JSON.parse(inserted.userAnswers as string)
      } : null;
    } finally {
      await db.close();
    }
  },

  getResults: async (): Promise<ExamResult[]> => {
    const db = await initializeDb();
    try {
      const results = await db.all<ExamResult[]>('SELECT * FROM exam_results ORDER BY created_at DESC');
      return results.map(r => ({
        ...r,
        questions: JSON.parse(r.questions as string),
        userAnswers: JSON.parse(r.userAnswers as string)
      }));
    } finally {
      await db.close();
    }
  }
};