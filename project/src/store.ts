import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

// إنشاء مخزن مشترك باستخدام localStorage
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
      updateSubjects: (subjects) => {
        set({ subjects });
        // إرسال تحديث للمخزن المشترك
        window.localStorage.setItem('shared-exam-subjects', JSON.stringify(subjects));
        // إرسال حدث للتحديث في جميع النوافذ المفتوحة
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'shared-exam-subjects',
          newValue: JSON.stringify(subjects)
        }));
      },
    }),
    {
      name: 'exam-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ subjects: state.subjects }),
      onRehydrateStorage: () => {
        // الاستماع لتحديثات المخزن من النوافذ الأخرى
        window.addEventListener('storage', (event) => {
          if (event.key === 'shared-exam-subjects') {
            const newSubjects = JSON.parse(event.newValue || '[]');
            useStore.setState({ subjects: newSubjects });
          }
        });
      },
    }
  )
);

// استرجاع الأسئلة المشتركة عند بدء التطبيق
const initializeSharedSubjects = () => {
  const sharedSubjects = window.localStorage.getItem('shared-exam-subjects');
  if (sharedSubjects) {
    useStore.setState({ subjects: JSON.parse(sharedSubjects) });
  }
};

// تنفيذ الاسترجاع عند تحميل التطبيق
initializeSharedSubjects();