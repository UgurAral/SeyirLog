/**
 * ads.ts — AdMob reklam yönetimi
 * Platform bazlı ID seçimi: Android / iOS
 * ID'ler .env (local) veya EAS Secrets (build) üzerinden gelir — GitHub'a gitmez.
 */

import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { BannerAd, BannerAdSize };

// Store ekran görüntüsü almak gibi durumlarda reklamları geçici olarak
// kapatmak için — sadece yerel .env üzerinden, gitignored, prod build'leri
// (EAS secrets) etkilemez.
export const ADS_DISABLED = process.env.EXPO_PUBLIC_DISABLE_ADS === 'true';

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

// ── SDK başlatma + ödüllü reklamı önden yükleme ──────────────────────────────
// SDK açıkça başlatılmadan yapılan imperatif RewardedAd.load() çağrıları
// (bir bileşenin mount olmasını beklemeden) tutarsız davranabiliyor; ayrıca
// "Günü Bitir" anında sıfırdan yükleme başlatmak birkaç saniye sürebildiği
// için 10sn zaman aşımına takılıp reklamsız geçme ihtimalini artırıyordu.
// Bu yüzden uygulama açılışında SDK başlatılır ve bir sonraki gösterim için
// arka planda bir ödüllü reklam önceden yüklenir.
let preloadedRewarded: RewardedAd | null = null;
let preloadedRewardedReady = false;

function preloadRewardedAd(): void {
  const rewarded = RewardedAd.createForAdRequest(AD_UNITS.REWARDED, {
    requestNonPersonalizedAdsOnly: true,
  });
  preloadedRewarded = rewarded;
  preloadedRewardedReady = false;

  const unsubLoad = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    if (preloadedRewarded === rewarded) preloadedRewardedReady = true;
    unsubLoad();
    unsubError();
  });
  const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
    if (preloadedRewarded === rewarded) {
      preloadedRewarded = null;
      preloadedRewardedReady = false;
      // İlk yükleme başarısız olursa (örn. açılışta ağ yoksa) bir daha
      // hiç yeniden denenmezse "Günü Bitir" oturum boyunca hep 10sn
      // zaman aşımlı yavaş yola düşer — bir süre sonra tekrar dene.
      setTimeout(preloadRewardedAd, 30000);
    }
    unsubLoad();
    unsubError();
  });
  rewarded.load();
}

export function initAds(): void {
  if (ADS_DISABLED) return;
  mobileAds()
    .initialize()
    .then(() => preloadRewardedAd())
    .catch(() => {});
}

export function showRewardedAd(): Promise<boolean> {
  if (ADS_DISABLED) return Promise.resolve(true);
  return new Promise((resolve) => {
    const usingPreloaded = preloadedRewardedReady && preloadedRewarded != null;
    const rewarded = usingPreloaded
      ? preloadedRewarded!
      : RewardedAd.createForAdRequest(AD_UNITS.REWARDED, { requestNonPersonalizedAdsOnly: true });
    // Önden yüklenmiş reklam kullanılıyorsa hemen bir sonraki gösterim için
    // yeni bir tane yüklemeye başla; bu instance tekrar kullanılamaz.
    if (usingPreloaded) {
      preloadedRewarded = null;
      preloadedRewardedReady = false;
      preloadRewardedAd();
    }

    let loaded = usingPreloaded;

    const unsubLoad = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      loaded = true;
      rewarded.show();
    });

    if (usingPreloaded) {
      rewarded.show();
    }

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
      // Reklam gerçekten gösterildi ama ödül alınmadan erken kapatıldı:
      // kaydı yine de geçir, ama 5 dakikalık sayacı başlatma — kullanıcı
      // reklamı tam izlemeden sayaç işlemiş olmasın.
      unsubLoad();
      unsubEarned();
      unsubClose();
      unsubError();
      resolve(true);
    });

    // Reklam ağı NO_FILL/hata dönerse (AdMob'un doldurmadığı durumlar dahil)
    // çekirdek işlevi (veri girişi) kilitleme — kaydı geçir, sayaç başlamaz.
    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      unsubLoad();
      unsubEarned();
      unsubClose();
      unsubError();
      resolve(true);
    });

    if (!usingPreloaded) {
      rewarded.load();
    }

    // Reklam 10 sn içinde hiç yüklenemezse yine de kaydı geçir — sayaç
    // başlamaz, bir sonraki denemede tekrar reklam yüklemeyi dener.
    setTimeout(() => {
      if (!loaded) {
        unsubLoad();
        unsubEarned();
        unsubClose();
        unsubError();
        resolve(true);
      }
    }, 10000);
  });
}
