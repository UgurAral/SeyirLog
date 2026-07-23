import { create } from 'zustand';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firebaseAuth } from '@services/auth';

interface AuthStore {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setLoading: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

// Auth durumunu dinle — app başlangıcında çağır
export function initAuthListener() {
  return firebaseAuth.onAuthStateChanged((user: FirebaseAuthTypes.User | null) => {
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setInitialized(true);
  });
}
