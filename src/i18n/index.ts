/**
 * i18n.ts — Uygulama dili yönetimi
 * Sıra: kullanıcının daha önce seçtiği dil (AsyncStorage) → cihazın sistem
 * dili (destekleniyorsa) → varsayılan olarak Türkçe.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from './locales/tr';
import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'es', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; flag: string; name: string }[] = [
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
];

const LANGUAGE_STORAGE_KEY = '@seyirlog_language';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
};

function isSupported(code: string | null | undefined): code is SupportedLanguage {
  return !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

function getDeviceLanguage(): SupportedLanguage {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode;
  return isSupported(code) ? code : 'tr';
}

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isSupported(stored) ? stored : null;
}

/** Uygulama açılışında bir kere çağrılır — dil tercihini yükleyip i18next'i başlatır. */
export async function initI18n(): Promise<void> {
  const stored = await getStoredLanguage();
  const language = stored ?? getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
  });
}

/** Kullanıcı Profil ekranından dil değiştirdiğinde çağrılır — tercihi kalıcı olarak saklar. */
export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
}

export default i18n;
