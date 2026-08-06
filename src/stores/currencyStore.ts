/**
 * currencyStore.ts — Uygulama genelinde geçerli olan tek para birimi ayarı.
 * Sadece Profil ekranından değiştirilir; değiştiği andan itibaren yeni
 * girilen tüm sefer/yakıt/gider/gelir kayıtları bu para biriminde damgalanır.
 * Geçmiş kayıtlar kendi girildikleri para biriminde kalır (dönüştürülmez).
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_CURRENCIES = ['TRY', 'USD', 'EUR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

const CURRENCY_STORAGE_KEY = '@seyirlog_currency';

function isSupportedCurrency(code: string | null): code is SupportedCurrency {
  return !!code && (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

interface CurrencyStore {
  currency: SupportedCurrency;
  initialized: boolean;
  initCurrency: () => Promise<void>;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>((set) => ({
  currency: 'TRY',
  initialized: false,

  initCurrency: async () => {
    const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
    set({ currency: isSupportedCurrency(stored) ? stored : 'TRY', initialized: true });
  },

  setCurrency: async (currency: SupportedCurrency) => {
    await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    set({ currency });
  },
}));
