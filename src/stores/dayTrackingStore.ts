/**
 * dayTrackingStore.ts — Kullanıcının elle başlatıp bitirdiği "gün" (vardiya)
 * takibi. Günün Özeti ekranı artık sabit "son 24 saat" yerine, kullanıcının
 * "Günü Başlat" dediği andan "Günü Bitir" dediği ana kadar geçen aralığı
 * gösterir.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY_START_STORAGE_KEY = '@seyirlog_day_started_at';

interface DayTrackingStore {
  dayStartedAt: number | null;
  initialized: boolean;
  initDayTracking: () => Promise<void>;
  startDay: () => Promise<number>;
  endDay: () => Promise<void>;
}

export const useDayTrackingStore = create<DayTrackingStore>((set) => ({
  dayStartedAt: null,
  initialized: false,

  initDayTracking: async () => {
    const stored = await AsyncStorage.getItem(DAY_START_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    set({ dayStartedAt: Number.isFinite(parsed) ? parsed : null, initialized: true });
  },

  startDay: async () => {
    const now = Math.floor(Date.now() / 1000);
    await AsyncStorage.setItem(DAY_START_STORAGE_KEY, String(now));
    set({ dayStartedAt: now });
    return now;
  },

  endDay: async () => {
    await AsyncStorage.removeItem(DAY_START_STORAGE_KEY);
    set({ dayStartedAt: null });
  },
}));
