/** Desteklenen uygulama dili kodunu Intl locale koduna çevirir. */
const INTL_LOCALES: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
};

function toIntlLocale(lang?: string): string {
  return INTL_LOCALES[lang ?? 'tr'] ?? 'tr-TR';
}

/** Saat/dakika kısaltmaları — dile göre değişen kelimeler. */
const DURATION_UNITS: Record<string, { h: string; m: string }> = {
  tr: { h: 's', m: 'dk' },
  en: { h: 'h', m: 'm' },
  es: { h: 'h', m: 'min' },
  de: { h: 'Std', m: 'Min' },
};

/**
 * Para miktarını Türk Lirası formatında biçimlendirir.
 * @param amount - Para miktarı (sayı)
 * @param currency - Para birimi kodu (varsayılan: 'TRY')
 * @returns Biçimlendirilmiş para metni, örn. "1.234,50 ₺"
 */
export function formatCurrency(amount: number, currency = 'TRY'): string {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
  };
  const symbol = symbols[currency] ?? currency;

  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${symbol}`;
}

/**
 * Kilometre değerini biçimlendirir.
 * @param km - Kilometre değeri
 * @returns Biçimlendirilmiş km metni, örn. "1.234 km"
 */
export function formatKm(km: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(km);
  return `${formatted} km`;
}

/**
 * Dakika cinsinden süreyi saat ve dakika formatında biçimlendirir.
 * @param minutes - Toplam dakika
 * @param lang - Uygulama dili kodu ('tr' | 'en' | 'es' | 'de'), varsayılan 'tr'
 * @returns Biçimlendirilmiş süre, örn. "2s 30dk" veya "45dk"
 */
export function formatDuration(minutes: number, lang?: string): string {
  const units = DURATION_UNITS[lang ?? 'tr'] ?? DURATION_UNITS.tr;
  if (minutes <= 0) return `0${units.m}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}${units.h} ${m}${units.m}`;
  if (h > 0) return `${h}${units.h}`;
  return `${m}${units.m}`;
}

/**
 * Unix timestamp'i kısa tarih formatına çevirir.
 * @param timestamp - Unix timestamp (saniye)
 * @param lang - Uygulama dili kodu ('tr' | 'en' | 'es' | 'de'), varsayılan 'tr'
 * @returns Biçimlendirilmiş tarih, örn. "22 Tem 2026"
 */
export function formatDate(timestamp: number, lang?: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(timestamp * 1000));
}

/**
 * Unix timestamp'i tarih ve saat formatına çevirir.
 * @param timestamp - Unix timestamp (saniye)
 * @param lang - Uygulama dili kodu ('tr' | 'en' | 'es' | 'de'), varsayılan 'tr'
 * @returns Biçimlendirilmiş tarih ve saat, örn. "22 Tem 2026, 14:30"
 */
export function formatDateTime(timestamp: number, lang?: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(timestamp * 1000));
}

/**
 * Unix timestamp'i sadece saat formatına çevirir.
 * @param timestamp - Unix timestamp (saniye)
 * @param lang - Uygulama dili kodu ('tr' | 'en' | 'es' | 'de'), varsayılan 'tr'
 * @returns Biçimlendirilmiş saat, örn. "14:30"
 */
export function formatTime(timestamp: number, lang?: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(timestamp * 1000));
}

/**
 * Litre değerini biçimlendirir.
 * @param liters - Litre değeri
 * @returns Biçimlendirilmiş litre metni, örn. "45,5 L"
 */
export function formatLiters(liters: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(liters);
  return `${formatted} L`;
}

/**
 * Yüzde değerini biçimlendirir.
 * @param value - Yüzde değeri (0-100)
 * @returns Biçimlendirilmiş yüzde metni, örn. "%12,5"
 */
export function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
  return `%${formatted}`;
}
