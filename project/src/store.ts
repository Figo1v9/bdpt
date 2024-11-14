import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Subject } from './types';

interface AppState {
  currentStudent: Student | null;
  subjects: Subject[];
  setCurrentStudent: (student: Student | null) => void;
  addStudent: (name: string) => void;
  updateSubjects: (subjects: Subject[]) => void;
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
    (set) => ({
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
    }),
    {
      name: 'exam-storage',
    }
  )
);