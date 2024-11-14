import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Subject } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';

interface AppState {
  currentStudent: Student | null;
  subjects: Subject[];
  setCurrentStudent: (student: Student | null) => void;
  addStudent: (name: string) => void;
  updateSubjects: (subjects: Subject[]) => void;
  initializeSubjects: () => Promise<void>;
  loading: boolean;
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
      loading: true,
      setCurrentStudent: (student) => set({ currentStudent: student }),
      addStudent: (name) =>
        set((state) => ({
          currentStudent: {
            id: Math.random().toString(36).substr(2, 9),
            name,
            examResults: [],
          },
        })),
      updateSubjects: async (subjects) => {
        try {
          // Update Firestore
          await setDoc(doc(db, 'data', 'subjects'), { subjects });
          set({ subjects });
        } catch (error) {
          console.error('Error updating subjects:', error);
        }
      },
      initializeSubjects: async () => {
        try {
          set({ loading: true });
          
          // Set up real-time listener
          const unsubscribe = onSnapshot(doc(db, 'data', 'subjects'), (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              set({ subjects: data.subjects, loading: false });
            } else {
              // If no data exists, initialize with default subjects
              get().updateSubjects(defaultSubjects);
              set({ loading: false });
            }
          });

          // Clean up listener on unmount
          return () => unsubscribe();
        } catch (error) {
          console.error('Error initializing subjects:', error);
          set({ loading: false });
        }
      },
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({ currentStudent: state.currentStudent }),
    }
  )
);