/**
 * ads.ts — AdMob reklam yönetimi
 *
 * Banner ID'leri:     üst + alt banner
 * Rewarded ID:        veri girişi kapısı (5 dk'da bir)
 *
 * ⚠️  Şu an TEST reklam ID'leri kullanılıyor.
 *     Gerçek yayın için aşağıdaki ID'leri AdMob konsolundan al ve değiştir.
 */

import {
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Reklam Unit ID'leri ───────────────────────────────────────────────────────
// TODO: Yayın öncesi gerçek AdMob ID'lerinizle değiştirin
export const AD_UNITS = {
  BANNER_TOP:    __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  BANNER_BOTTOM: __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  REWARDED:      __DEV__ ? TestIds.REWARDED        : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

export { BannerAd, BannerAdSize };

// ── Rewarded reklam ───────────────────────────────────────────────────────────
const LAST_AD_KEY = '@seyirlog_last_ad_ts';
const AD_INTERVAL_MS = 5 * 60 * 1000; // 5 dakika

/**
 * Son reklam izlenme zamanına göre reklam gösterilmesi gerekip gerekmediğini döner.
 */
export async function shouldShowAd(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LAST_AD_KEY);
  if (!raw) return true;
  return Date.now() - parseInt(raw, 10) > AD_INTERVAL_MS;
}

/**
 * Rewarded reklamı yükle ve göster.
 * Kullanıcı ödülü kazanırsa (izleme tamamlandı) resolve(true).
 * İptal ederse resolve(false).
 */
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

    // Reklam kapatıldı ama ödül kazanılmadı (erken çıkış)
    const unsubClose = rewarded.addAdEventListener('closed' as any, () => {
      if (!loaded) return; // henüz yüklenmediyse load hatası gelecek
      unsubLoad();
      unsubEarned();
      unsubClose();
      resolve(false);
    });

    rewarded.load();

    // 10 sn içinde yüklenemezse geç
    setTimeout(() => {
      if (!loaded) {
        unsubLoad();
        unsubEarned();
        unsubClose();
        resolve(true); // reklam yüklenemedi, kullanıcıyı engelleme
      }
    }, 10000);
  });
}
