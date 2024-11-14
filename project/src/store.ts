import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Subject } from './types';
import { saveSubjects, getSubjects } from './db';

interface AppState {
  currentStudent: Student | null;
  subjects: Subject[];
  setCurrentStudent: (student: Student | null) => void;
  addStudent: (name: string) => void;
  updateSubjects: (subjects: Subject[]) => void;
  initializeSubjects: () => Promise<void>;
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
      updateSubjects: async (subjects) => {
        await saveSubjects(subjects);
        set({ subjects });
        // Broadcast the update to other tabs
        const channel = new BroadcastChannel('exam-system');
        channel.postMessage({ type: 'SUBJECTS_UPDATED' });
      },
      initializeSubjects: async () => {
        const savedSubjects = await getSubjects();
        if (savedSubjects) {
          set({ subjects: savedSubjects });
        }
      },
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({ currentStudent: state.currentStudent }),
    }
  )
);

// Listen for updates from other tabs
const channel = new BroadcastChannel('exam-system');
channel.onmessage = async (event) => {
  if (event.data.type === 'SUBJECTS_UPDATED') {
    const savedSubjects = await getSubjects();
    if (savedSubjects) {
      useStore.setState({ subjects: savedSubjects });
    }
  }
};

// Initialize subjects on app load
useStore.getState().initializeSubjects();