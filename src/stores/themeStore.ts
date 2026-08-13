/**
 * themeStore.ts — Kullanıcının tema tercihini (Sistem/Açık/Koyu) kalıcı olarak
 * tutar. Gerçek çözümlenmiş renk paketi (`useTheme` hook'unda, cihazın anlık
 * `useColorScheme()` değeriyle birleştirilerek) hesaplanır — bu store sadece
 * kullanıcının SEÇTİĞİ modu saklar, "system" iken hangi rengin aktif olduğunu
 * bilmez.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_MODE_KEY = '@seyirlog_theme_mode';

interface ThemeStore {
  mode: ThemeMode;
  initialized: boolean;
  initTheme: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'system',
  initialized: false,

  initTheme: async () => {
    const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
    const mode: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'system';
    set({ mode, initialized: true });
  },

  setMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    set({ mode });
  },
}));
