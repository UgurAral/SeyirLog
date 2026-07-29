/**
 * ads.ts — AdMob reklam yönetimi
 * Platform bazlı ID seçimi: Android / iOS
 * ID'ler .env (local) veya EAS Secrets (build) üzerinden gelir — GitHub'a gitmez.
 */

import { Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { BannerAd, BannerAdSize };

// ── Platform bazlı Ad Unit ID seçimi ─────────────────────────────────────────
const isAndroid = Platform.OS === 'android';

// Gerçek ad unit ID'si tanımlanmamışsa (env değişkeni eksikse) sessizce boş
// string'e düşüp reklamı hiç yüklememek yerine Google'ın test ID'sine düş —
// böylece ID'ler eksik kalsa bile en azından test reklamı gösterilir.
const androidBannerTop = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_TOP || TestIds.ADAPTIVE_BANNER;
const iosBannerTop = process.env.EXPO_PUBLIC_ADMOB_BANNER_TOP || TestIds.ADAPTIVE_BANNER;
const androidBannerBottom = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_BOTTOM || TestIds.ADAPTIVE_BANNER;
const iosBannerBottom = process.env.EXPO_PUBLIC_ADMOB_BANNER_BOTTOM || TestIds.ADAPTIVE_BANNER;
const androidRewarded = process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED || TestIds.REWARDED;
const iosRewarded = process.env.EXPO_PUBLIC_ADMOB_REWARDED || TestIds.REWARDED;

export const AD_UNITS = {
  BANNER_TOP: __DEV__ ? TestIds.ADAPTIVE_BANNER : isAndroid ? androidBannerTop : iosBannerTop,
  BANNER_BOTTOM: __DEV__ ? TestIds.ADAPTIVE_BANNER : isAndroid ? androidBannerBottom : iosBannerBottom,
  REWARDED: __DEV__ ? TestIds.REWARDED : isAndroid ? androidRewarded : iosRewarded,
};

// ── 5 dakika kapısı ───────────────────────────────────────────────────────────
const LAST_AD_KEY = '@seyirlog_last_ad_ts';
const AD_INTERVAL_MS = 5 * 60 * 1000;

export async function shouldShowAd(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LAST_AD_KEY);
  if (!raw) return true;
  return Date.now() - parseInt(raw, 10) > AD_INTERVAL_MS;
}

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(AD_UNITS.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    let loaded = false;

    const unsubLoad = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      loaded = true;
      rewarded.show();
    });

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        await AsyncStorage.setItem(LAST_AD_KEY, String(Date.now()));
        unsubLoad();
        unsubEarned();
        resolve(true);
      },
    );

    const unsubClose = rewarded.addAdEventListener('closed' as any, () => {
      if (!loaded) return;
      unsubLoad();
      unsubEarned();
      unsubClose();
      resolve(false);
    });

    rewarded.load();

    // 10 sn içinde yüklenemezse geç (kullanıcıyı engelleme)
    setTimeout(() => {
      if (!loaded) {
        unsubLoad();
        unsubEarned();
        unsubClose();
        resolve(true);
      }
    }, 10000);
  });
}
