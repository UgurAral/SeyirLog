/**
 * Dönem filtreleri için yardımcı tarih fonksiyonları.
 * Tüm timestamp'ler Unix saniye cinsinden (Math.floor(Date / 1000)).
 */

/** Verilen tarihin başlangıç anını (00:00:00) Unix timestamp olarak döndürür. */
export function getStartOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/**
 * Verilen tarihin haftasının Pazartesi günü başlangıcını döndürür.
 * ISO 8601 standardına uygun (Pazartesi = haftanın ilk günü).
 */
export function getStartOfWeek(date: Date): number {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
  const diffToPreviousMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToPreviousMonday);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/** Verilen tarihin ayın ilk günü başlangıcını döndürür. */
export function getStartOfMonth(date: Date): number {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/**
 * Verilen Unix timestamp'in belirtilen döneme dahil olup olmadığını kontrol eder.
 * @param timestamp - Unix saniye cinsinden timestamp
 * @param period - 'today' | 'week' | 'month'
 */
export function isInPeriod(
  timestamp: number,
  period: 'today' | 'week' | 'month',
): boolean {
  const now = new Date();
  let start: number;

  switch (period) {
    case 'today':
      start = getStartOfDay(now);
      break;
    case 'week':
      start = getStartOfWeek(now);
      break;
    case 'month':
      start = getStartOfMonth(now);
      break;
  }

  return timestamp >= start;
}

/** Dönem etiketlerini Türkçe döndürür. */
export const PERIOD_LABELS: Record<'today' | 'week' | 'month' | 'all', string> = {
  today: 'Bugün',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  all: 'Tümü',
};
