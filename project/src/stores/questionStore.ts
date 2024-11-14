import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socketService } from '../services/socket';

interface Question {
  id: number;
  text: string;
  choices: string[];
  correctAnswer: number;
  subjectId: string;
  timeLimit: number;
}

interface QuestionState {
  questions: Question[];
  addQuestion: (question: Question) => void;
  removeQuestion: (id: number) => void;
  setQuestions: (questions: Question[]) => void;
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set) => ({
      questions: [],
      addQuestion: (question) => {
        set((state) => ({
          questions: [...state.questions, question]
        }));
        socketService.emitQuestionAdded(question);
      },
      removeQuestion: (id) => {
        set((state) => ({
          questions: state.questions.filter(q => q.id !== id)
        }));
      },
      setQuestions: (questions) => set({ questions })
    }),
    {
      name: 'questions-storage',
    }
  )
);