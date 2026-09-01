/**
 * goalStore.ts — Finans ekranındaki kazanç hedefi. Sadece cihazda (AsyncStorage)
 * tutulur, currencyStore/distanceUnitStore ile aynı desen — SQLite/Firestore'a
 * girmez, cihazlar arası senkronize olmaz (kişisel bir hedef, çoklu cihaz
 * tutarlılığı gerektirmiyor).
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FinansGoal {
  amount: number;
  currency: string;
  /** İstanbul takvim gününün 00:00'ı (Unix saniye) */
  startDate: number;
  /** İstanbul takvim gününün 00:00'ı (Unix saniye) — o gün dahil */
  endDate: number;
}

const GOAL_STORAGE_KEY = '@seyirlog_finans_goal';

interface GoalStore {
  goal: FinansGoal | null;
  initialized: boolean;
  initGoal: () => Promise<void>;
  setGoal: (goal: FinansGoal | null) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goal: null,
  initialized: false,

  initGoal: async () => {
    const stored = await AsyncStorage.getItem(GOAL_STORAGE_KEY);
    try {
      set({ goal: stored ? (JSON.parse(stored) as FinansGoal) : null, initialized: true });
    } catch {
      set({ goal: null, initialized: true });
    }
  },

  setGoal: async (goal) => {
    if (goal) {
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal));
    } else {
      await AsyncStorage.removeItem(GOAL_STORAGE_KEY);
    }
    set({ goal });
  },
}));
