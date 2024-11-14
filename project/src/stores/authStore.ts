import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  isAdmin: boolean;
  email?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      login: (user) => {
        if (!user.id || !user.name) {
          throw new Error('Invalid user data');
        }
        set({ isAuthenticated: true, isAdmin: user.isAdmin, user });
      },
      logout: () => {
        set({ isAuthenticated: false, isAdmin: false, user: null });
        localStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        user: state.user,
      }),
    }
  )
);