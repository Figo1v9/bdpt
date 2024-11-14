
// file: lib/db.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Question } from '../types';

const initializeDb = async () => {
  return open({
    filename: './data.db',
    driver: sqlite3.Database
  });
};

const initializeTable = async () => {
  const db = await initializeDb();
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
  await db.close();
};

initializeTable().catch(console.error);

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
        options: JSON.parse(q.options as unknown as string)
      }));
    } finally {
      await db.close();
    }
  },

  addQuestion: async (question: Omit<Question, 'id'>): Promise<Question> => {
    const db = await initializeDb();
    try {
      const id = generateId();
      const optionsJson = JSON.stringify(question.options);
      
      await db.run(
        `INSERT INTO questions (id, text, subject, options, correctAnswer, explanation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, question.text, question.subject, optionsJson, question.correctAnswer, question.explanation]
      );

      const inserted = await db.get<Question>('SELECT * FROM questions WHERE id = ?', [id]);
      return {
        ...inserted!,
        options: JSON.parse(inserted!.options as unknown as string)
      };
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
        options: JSON.parse(q.options as unknown as string)
      }));
    } finally {
      await db.close();
    }
  }
};
