/**
 * onboardingStore.ts — İlk kullanım rehberinin (walkthrough) daha önce
 * görülüp görülmediğini takip eder. Bir kez tamamlanınca/atlanınca bir daha
 * gösterilmez.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = '@seyirlog_onboarding_seen';

interface OnboardingStore {
  seen: boolean;
  initialized: boolean;
  initOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  seen: false,
  initialized: false,

  initOnboarding: async () => {
    const stored = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
    set({ seen: stored === '1', initialized: true });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    set({ seen: true });
  },
}));
