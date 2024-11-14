import { Question, ExamResult } from '../types';
import { questionsApi as cloudApi, resultsApi as cloudResultsApi } from './supabase';
import { questionsApi as localApi, resultsApi as localResultsApi } from './db';

// Function to check if cloud storage is available
const isCloudAvailable = async (): Promise<boolean> => {
  try {
    await cloudApi.getQuestions();
    return true;
  } catch (error) {
    console.warn('Cloud storage unavailable, falling back to local storage');
    return false;
  }
};

// Unified storage API that automatically handles fallback
export const storage = {
  questions: {
    getQuestions: async (): Promise<Question[]> => {
      return (await isCloudAvailable()) 
        ? cloudApi.getQuestions()
        : localApi.getQuestions();
    },

    addQuestion: async (question: Omit<Question, 'id' | 'created_at'>): Promise<Question | null> => {
      return (await isCloudAvailable())
        ? cloudApi.addQuestion(question)
        : localApi.addQuestion(question);
    },

    deleteQuestion: async (id: string): Promise<boolean> => {
      return (await isCloudAvailable())
        ? cloudApi.deleteQuestion(id)
        : localApi.deleteQuestion(id);
    },

    searchQuestions: async (subject: string, searchTerm: string): Promise<Question[]> => {
      return (await isCloudAvailable())
        ? cloudApi.searchQuestions(subject, searchTerm)
        : localApi.searchQuestions(subject, searchTerm);
    }
  },

  results: {
    saveResult: async (result: Omit<ExamResult, 'id'>): Promise<ExamResult | null> => {
      return (await isCloudAvailable())
        ? cloudResultsApi.saveResult(result)
        : localResultsApi.saveResult(result);
    },

    getResults: async (): Promise<ExamResult[]> => {
      return (await isCloudAvailable())
        ? cloudResultsApi.getResults()
        : localResultsApi.getResults();
    }
  }
};