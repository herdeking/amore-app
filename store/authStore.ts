import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUid: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUid: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setFirebaseUid: (uid) => set({ firebaseUid: uid }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'amore-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        firebaseUid: state.firebaseUid,
      }),
    }
  )
);
