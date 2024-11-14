import { createClient } from '@supabase/supabase-js';
import type { Question, ExamResult } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database tables
const initDatabase = async () => {
  // Create questions table
  const { error: questionsError } = await supabase.from('questions').select('*').limit(1);
  
  if (questionsError?.message?.includes('does not exist')) {
    const { error } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS public.questions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        text TEXT NOT NULL,
        subject TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    
    if (error) {
      console.error('Error creating questions table:', error);
    }
  }

  // Create exam_results table
  const { error: resultsError } = await supabase.from('exam_results').select('*').limit(1);
  
  if (resultsError?.message?.includes('does not exist')) {
    const { error } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS public.exam_results (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username TEXT NOT NULL,
        subject TEXT NOT NULL,
        score INTEGER NOT NULL,
        time_spent INTEGER NOT NULL,
        questions JSONB NOT NULL,
        user_answers INTEGER[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    
    if (error) {
      console.error('Error creating exam_results table:', error);
    }
  }
};

// Initialize tables when the app starts
initDatabase().catch(console.error);

export const questionsApi = {
  async getQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    return data || [];
  },

  async addQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .insert([{
        ...question,
        options: JSON.stringify(question.options),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding question:', error);
      return null;
    }

    return {
      ...data,
      options: JSON.parse(data.options)
    };
  },

  async deleteQuestion(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      return false;
    }

    return true;
  },

  async searchQuestions(subject: string, searchTerm: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', subject)
      .or(`text.ilike.%${searchTerm}%, options.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching questions:', error);
      return [];
    }

    return data?.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    })) || [];
  }
};

export const resultsApi = {
  async saveResult(result: Omit<ExamResult, 'id'>): Promise<ExamResult | null> {
    const { data, error } = await supabase
      .from('exam_results')
      .insert([{
        ...result,
        questions: JSON.stringify(result.questions),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving result:', error);
      return null;
    }

    return {
      ...data,
      questions: JSON.parse(data.questions)
    };
  },

  async getResults(): Promise<ExamResult[]> {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching results:', error);
      return [];
    }

    return data?.map(r => ({
      ...r,
      questions: JSON.parse(r.questions)
    })) || [];
  }
};