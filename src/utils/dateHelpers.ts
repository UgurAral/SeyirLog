/**
 * Dönem filtreleri için yardımcı tarih fonksiyonları.
 * Tüm timestamp'ler Unix saniye cinsinden (Math.floor(Date / 1000)).
 *
 * Gün/hafta/ay sınırları her zaman İSTANBUL saatine göre hesaplanır — cihazın
 * kendi saat dilimine göre DEĞİL. Bunun nedeni: formatters.ts'teki tüm
 * tarih gösterimleri (formatDate, formatDateTime, formatTime) `Europe/Istanbul`
 * saat dilimine sabitlenmiş; eğer bu dosyadaki sınırlar cihazın yerel saat
 * dilimini kullansaydı, cihaz İstanbul dışında bir saat diliminde ayarlıysa
 * (örn. UTC), "Bugün" filtresi kullanıcıya İstanbul saatiyle "bugün" olarak
 * gösterilen bir kaydı dışarıda bırakabilirdi. Türkiye 2016'dan beri DST
 * uygulamadığı için sabit +3 ofset güvenli.
 */
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Verilen anın İstanbul takvim gününün (YYYY-MM-DD) UTC alanlarını döndürür. */
function toIstanbulShifted(date: Date): Date {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MS);
}

/** İstanbul saatiyle verilen Y/M/D 00:00:00'ın gerçek Unix timestamp'ini (saniye) döndürür. */
function istanbulMidnightToTimestamp(year: number, month: number, day: number): number {
  const utcMs = Date.UTC(year, month, day, 0, 0, 0) - ISTANBUL_OFFSET_MS;
  return Math.floor(utcMs / 1000);
}

/** Verilen tarihin İstanbul saatiyle günün başlangıcını (00:00:00) Unix timestamp olarak döndürür. */
export function getStartOfDay(date: Date): number {
  const shifted = toIstanbulShifted(date);
  return istanbulMidnightToTimestamp(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

/**
 * Verilen Unix timestamp'in belirtilen döneme dahil olup olmadığını kontrol eder.
 *
 * 'week' ve 'month', takvim haftası/ayı (örn. Pazartesi ya da ayın 1'i) DEĞİL,
 * kayan (rolling) son 7/30 gündür — 'last24h' ile aynı mantık. Aksi halde ayın
 * ilk günlerinde bir önceki ayın son günlerine ait kayıtlar "Ay" sekmesinden
 * aniden kaybolur (örn. 31 Temmuz kaydı 7 Ağustos'ta "Ay" filtresinde görünmez).
 * @param timestamp - Unix saniye cinsinden timestamp
 * @param period - 'today' | 'last24h' | 'week' | 'month'
 */
export function isInPeriod(
  timestamp: number,
  period: 'today' | 'last24h' | 'week' | 'month',
): boolean {
  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  let start: number;

  switch (period) {
    case 'today':
      start = getStartOfDay(now);
      break;
    case 'last24h':
      start = nowSeconds - 24 * 60 * 60;
      break;
    case 'week':
      start = nowSeconds - 7 * 24 * 60 * 60;
      break;
    case 'month':
      start = nowSeconds - 30 * 24 * 60 * 60;
      break;
  }

  return timestamp >= start;
}

/**
 * Verilen Unix timestamp'in İstanbul saatiyle tarih (YYYY-MM-DD), saat (0-23) ve
 * haftanın günü (0=Pazar..6=Cumartesi) bileşenlerini döndürür. Anonim talep
 * sinyali (demand_signals) kaydı için kullanılır.
 */
export function getIstanbulDateParts(timestamp: number): {
  date: string;
  hour: number;
  dayOfWeek: number;
} {
  const shifted = toIstanbulShifted(new Date(timestamp * 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    hour: shifted.getUTCHours(),
    dayOfWeek: shifted.getUTCDay(),
  };
}
