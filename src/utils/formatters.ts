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
 * @returns Biçimlendirilmiş süre, örn. "2s 30dk" veya "45dk"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0dk';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}s ${m}dk`;
  if (h > 0) return `${h}s`;
  return `${m}dk`;
}

/**
 * Unix timestamp'i Türkçe kısa tarih formatına çevirir.
 * @param timestamp - Unix timestamp (saniye)
 * @returns Biçimlendirilmiş tarih, örn. "22 Tem 2026"
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(timestamp * 1000));
}

/**
 * Unix timestamp'i Türkçe tarih ve saat formatına çevirir.
 * @param timestamp - Unix timestamp (saniye)
 * @returns Biçimlendirilmiş tarih ve saat, örn. "22 Tem 2026, 14:30"
 */
export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
