import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Subject, ExamResult } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, onSnapshot, writeBatch, query, orderBy, limit } from 'firebase/firestore';

interface AppState {
  currentStudent: Student | null;
  subjects: Subject[];
  examHistory: ExamResult[];
  setCurrentStudent: (student: Student | null) => void;
  addStudent: (name: string) => void;
  updateSubjects: (subjects: Subject[]) => void;
  initializeSubjects: () => Promise<void>;
  addExamResult: (result: ExamResult) => Promise<void>;
  getTopScores: (subjectId: string) => Promise<ExamResult[]>;
  loading: boolean;
  error: string | null;
}

const defaultSubjects: Subject[] = [
  { id: '1', name: 'إدارة أعمال', questions: [], timeLimit: 30 },
  { id: '2', name: 'اقتصاد', questions: [], timeLimit: 30 },
  { id: '3', name: 'محاسبة مالية', questions: [], timeLimit: 30 },
  { id: '4', name: 'انجليزي', questions: [], timeLimit: 30 },
  { id: '5', name: 'قانون', questions: [], timeLimit: 30 },
];

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastFetch = 0;
let cachedSubjects: Subject[] | null = null;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentStudent: null,
      subjects: defaultSubjects,
      examHistory: [],
      loading: true,
      error: null,

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
          set({ loading: true, error: null });
          const batch = writeBatch(db);
          
          // Update in smaller chunks for better performance
          const chunkSize = 20;
          for (let i = 0; i < subjects.length; i += chunkSize) {
            const chunk = subjects.slice(i, i + chunkSize);
            chunk.forEach((subject) => {
              const subjectRef = doc(db, 'subjects', subject.id);
              batch.set(subjectRef, subject);
            });
          }
          
          await batch.commit();
          cachedSubjects = subjects;
          lastFetch = Date.now();
          set({ subjects, loading: false });
        } catch (error) {
          console.error('Error updating subjects:', error);
          set({ error: 'فشل في تحديث المواد', loading: false });
        }
      },

      initializeSubjects: async () => {
        try {
          // Check cache first
          if (cachedSubjects && Date.now() - lastFetch < CACHE_DURATION) {
            set({ subjects: cachedSubjects, loading: false });
            return;
          }

          set({ loading: true, error: null });
          
          // Set up real-time listener with query optimization
          const unsubscribe = onSnapshot(
            query(collection(db, 'subjects'), orderBy('name')),
            (snapshot) => {
              const subjects: Subject[] = [];
              snapshot.forEach((doc) => {
                subjects.push(doc.data() as Subject);
              });
              
              cachedSubjects = subjects;
              lastFetch = Date.now();
              set({ subjects, loading: false });
            },
            (error) => {
              console.error('Error fetching subjects:', error);
              set({ error: 'فشل في تحميل المواد', loading: false });
            }
          );

          return () => unsubscribe();
        } catch (error) {
          console.error('Error initializing subjects:', error);
          set({ error: 'حدث خطأ في النظام', loading: false });
        }
      },

      addExamResult: async (result: ExamResult) => {
        try {
          const { currentStudent } = get();
          if (!currentStudent) return;

          await setDoc(
            doc(db, 'examResults', `${currentStudent.id}_${result.subjectId}_${Date.now()}`),
            {
              ...result,
              studentId: currentStudent.id,
              studentName: currentStudent.name,
              timestamp: Date.now(),
            }
          );

          set((state) => ({
            examHistory: [...state.examHistory, result],
          }));
        } catch (error) {
          console.error('Error saving exam result:', error);
          set({ error: 'فشل في حفظ نتيجة الاختبار' });
        }
      },

      getTopScores: async (subjectId: string) => {
        try {
          const topScoresQuery = query(
            collection(db, 'examResults'),
            orderBy('score', 'desc'),
            limit(10)
          );
          
          const snapshot = await getDocs(topScoresQuery);
          return snapshot.docs.map(doc => doc.data() as ExamResult);
        } catch (error) {
          console.error('Error fetching top scores:', error);
          return [];
        }
      },
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({ currentStudent: state.currentStudent }),
    }
  )
);