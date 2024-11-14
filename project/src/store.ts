import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Question {
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

interface Student {
  id: string;
  name: string;
  examResults: {
    subjectId: string;
    score: number;
    date: string;
    answers: number[];
  }[];
}

interface AppState {
  currentStudent: Student | null;
  subjects: Subject[];
  setCurrentStudent: (student: Student | null) => void;
  addStudent: (name: string) => void;
  updateSubjects: (subjects: Subject[]) => void;
  addQuestion: (subjectId: string, question: Question) => void;
  updateQuestion: (subjectId: string, questionId: string, question: Question) => void;
  deleteQuestion: (subjectId: string, questionId: string) => void;
}

const defaultSubjects: Subject[] = [
  { id: '1', name: 'إدارة أعمال', questions: [], timeLimit: 30 },
  { id: '2', name: 'اقتصاد', questions: [], timeLimit: 30 },
  { id: '3', name: 'محاسبة مالية', questions: [], timeLimit: 30 },
  { id: '4', name: 'انجليزي', questions: [], timeLimit: 30 },
  { id: '5', name: 'قانون', questions: [], timeLimit: 30 },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentStudent: null,
      subjects: defaultSubjects,
      
      setCurrentStudent: (student) => set({ currentStudent: student }),
      
      addStudent: (name) =>
        set((state) => ({
          currentStudent: {
            id: Math.random().toString(36).substr(2, 9),
            name,
            examResults: [],
          },
        })),

      updateSubjects: (subjects) => set({ subjects }),

      addQuestion: (subjectId: string, question: Question) => {
        set((state) => ({
          subjects: state.subjects.map((subject) => {
            if (subject.id === subjectId) {
              return {
                ...subject,
                questions: [...subject.questions, {
                  ...question,
                  id: Math.random().toString(36).substr(2, 9)
                }]
              };
            }
            return subject;
          })
        }));
      },

      updateQuestion: (subjectId: string, questionId: string, updatedQuestion: Question) => {
        set((state) => ({
          subjects: state.subjects.map((subject) => {
            if (subject.id === subjectId) {
              return {
                ...subject,
                questions: subject.questions.map((q) => 
                  q.id === questionId ? { ...updatedQuestion, id: questionId } : q
                )
              };
            }
            return subject;
          })
        }));
      },

      deleteQuestion: (subjectId: string, questionId: string) => {
        set((state) => ({
          subjects: state.subjects.map((subject) => {
            if (subject.id === subjectId) {
              return {
                ...subject,
                questions: subject.questions.filter((q) => q.id !== questionId)
              };
            }
            return subject;
          })
        }));
      },
    }),
    {
      name: 'exam-storage',
      // تخزين كل البيانات في localStorage
      partialize: (state) => ({
        subjects: state.subjects,
        // لا نخزن بيانات الطالب الحالي في التخزين المحلي
        currentStudent: null
      })
    }
  )
);
