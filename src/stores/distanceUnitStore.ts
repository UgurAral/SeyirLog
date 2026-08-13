/**
 * distanceUnitStore.ts — Uygulama genelinde geçerli olan mesafe birimi ayarı.
 * Sadece Profil ekranından değiştirilir. Veritabanında mesafe HER ZAMAN km
 * olarak saklanır — bu store sadece GÖSTERİM ve GİRİŞ birimini belirler,
 * para birimi gibi kayıt anında damgalanan bir alan değildir (dönüşüm saf
 * matematik, tarihsel bir anlamı yok).
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_DISTANCE_UNITS = ['km', 'mi'] as const;
export type DistanceUnit = (typeof SUPPORTED_DISTANCE_UNITS)[number];

const DISTANCE_UNIT_STORAGE_KEY = '@seyirlog_distance_unit';
const KM_PER_MILE = 1.609344;

function isDistanceUnit(value: string | null): value is DistanceUnit {
  return !!value && (SUPPORTED_DISTANCE_UNITS as readonly string[]).includes(value);
}

/** Ham km değerini (DB'deki gerçek değer) gösterim birimine çevirir. */
export function kmToDisplay(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? km / KM_PER_MILE : km;
}

/** Kullanıcının girdiği (seçili birimdeki) değeri DB'ye yazılacak km'ye çevirir. */
export function displayToKm(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value * KM_PER_MILE : value;
}

interface DistanceUnitStore {
  unit: DistanceUnit;
  initialized: boolean;
  initDistanceUnit: () => Promise<void>;
  setDistanceUnit: (unit: DistanceUnit) => Promise<void>;
}

export const useDistanceUnitStore = create<DistanceUnitStore>((set) => ({
  unit: 'km',
  initialized: false,

  initDistanceUnit: async () => {
    const stored = await AsyncStorage.getItem(DISTANCE_UNIT_STORAGE_KEY);
    set({ unit: isDistanceUnit(stored) ? stored : 'km', initialized: true });
  },

  setDistanceUnit: async (unit: DistanceUnit) => {
    await AsyncStorage.setItem(DISTANCE_UNIT_STORAGE_KEY, unit);
    set({ unit });
  },
}));
