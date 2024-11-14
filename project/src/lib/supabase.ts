import { createClient } from '@supabase/supabase-js';
import type { Question, ExamResult } from '../types';

const supabaseUrl = 'https://wxeutiazejeoxmbxjcgq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZXV0aWF6ZWplb3htYnhqY2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1NTExODAsImV4cCI6MjA0NzEyNzE4MH0.5FOBrBhwcuXKnThjL5wGP7AA_kyIcT4ZrRJZxy-g9Mo';

export const supabase = createClient(supabaseUrl, supabaseKey);

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

  async addQuestion(question: Omit<Question, 'id'>): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single();

    if (error) {
      console.error('Error adding question:', error);
      return null;
    }

    return data;
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
  }
};

export const resultsApi = {
  async saveResult(result: Omit<ExamResult, 'id'>): Promise<ExamResult | null> {
    const { data, error } = await supabase
      .from('exam_results')
      .insert([result])
      .select()
      .single();

    if (error) {
      console.error('Error saving result:', error);
      return null;
    }

    return data;
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

    return data || [];
  }
};