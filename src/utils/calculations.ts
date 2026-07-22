import type { Trip, FuelEntry, Expense, DailyStats, PeriodStats, TripDuration } from '@types/index';

/**
 * Net kazancı hesaplar.
 * @param earnings - Toplam kazanç (TL)
 * @param fuelCosts - Toplam yakıt maliyeti (TL)
 * @param otherExpenses - Diğer giderler (TL)
 * @returns Net kazanç (TL)
 */
export function calculateNetEarnings(
  earnings: number,
  fuelCosts: number,
  otherExpenses: number,
): number {
  return earnings - fuelCosts - otherExpenses;
}

/**
 * Km başına yakıt maliyetini hesaplar.
 * @param totalFuelCost - Toplam yakıt maliyeti (TL)
 * @param totalKm - Toplam kilometre
 * @returns Km başına yakıt maliyeti (TL/km). totalKm 0 ise 0 döner.
 */
export function calculateFuelCostPerKm(
  totalFuelCost: number,
  totalKm: number,
): number {
  if (totalKm <= 0) return 0;
  return totalFuelCost / totalKm;
}

/**
 * İki zaman damgası arasındaki süreyi hesaplar.
 * @param startTime - Başlangıç Unix timestamp (saniye)
 * @param endTime - Bitiş Unix timestamp (saniye)
 * @returns Saat, dakika ve gösterim metni içeren obje
 */
export function calculateTripDuration(
  startTime: number,
  endTime: number,
): TripDuration {
  const totalMinutes = Math.max(0, Math.floor((endTime - startTime) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let display = '';
  if (hours > 0 && minutes > 0) {
    display = `${hours}s ${minutes}dk`;
  } else if (hours > 0) {
    display = `${hours}s`;
  } else {
    display = `${minutes}dk`;
  }

  return { hours, minutes, display };
}

/**
 * Belirli bir gün için özet istatistikler hesaplar.
 * @param trips - Tüm seferler
 * @param fuelEntries - Tüm yakıt girişleri
 * @param expenses - Tüm giderler
 * @param date - Hedef gün (Unix timestamp, günün başı)
 * @returns Günlük istatistikler
 */
export function calculateDailyStats(
  trips: Trip[],
  fuelEntries: FuelEntry[],
  expenses: Expense[],
  date: number,
): DailyStats {
  const dayStart = getStartOfDay(date);
  const dayEnd = dayStart + 86400; // +24 saat

  const dayTrips = trips.filter(
    (t) => t.startTime >= dayStart && t.startTime < dayEnd,
  );
  const dayFuel = fuelEntries.filter(
    (f) => f.date >= dayStart && f.date < dayEnd,
  );
  const dayExpenses = expenses.filter(
    (e) => e.date >= dayStart && e.date < dayEnd,
  );

  const completedTrips = dayTrips.filter((t) => t.status === 'completed');
  const totalEarnings = completedTrips.reduce(
    (sum, t) => sum + (t.earnings ?? 0),
    0,
  );
  const totalFuelCost = dayFuel.reduce((sum, f) => sum + f.totalCost, 0);
  const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalKm = completedTrips.reduce(
    (sum, t) => sum + (t.distanceKm ?? 0),
    0,
  );

  return {
    date: dayStart,
    totalEarnings,
    totalFuelCost,
    totalExpenses,
    netEarnings: calculateNetEarnings(totalEarnings, totalFuelCost, totalExpenses),
    totalTrips: dayTrips.length,
    completedTrips: completedTrips.length,
    totalKm,
    fuelCostPerKm: calculateFuelCostPerKm(totalFuelCost, totalKm),
  };
}

/**
 * Belirli bir dönem için özet istatistikler hesaplar.
 * @param trips - Tüm seferler
 * @param fuelEntries - Tüm yakıt girişleri
 * @param expenses - Tüm giderler
 * @param startDate - Dönem başlangıcı (Unix timestamp)
 * @param endDate - Dönem sonu (Unix timestamp)
 * @returns Dönem istatistikleri
 */
export function calculatePeriodStats(
  trips: Trip[],
  fuelEntries: FuelEntry[],
  expenses: Expense[],
  startDate: number,
  endDate: number,
): PeriodStats {
  const periodTrips = trips.filter(
    (t) => t.startTime >= startDate && t.startTime <= endDate,
  );
  const periodFuel = fuelEntries.filter(
    (f) => f.date >= startDate && f.date <= endDate,
  );
  const periodExpenses = expenses.filter(
    (e) => e.date >= startDate && e.date <= endDate,
  );

  const completedTrips = periodTrips.filter((t) => t.status === 'completed');
  const totalEarnings = completedTrips.reduce(
    (sum, t) => sum + (t.earnings ?? 0),
    0,
  );
  const totalFuelCost = periodFuel.reduce((sum, f) => sum + f.totalCost, 0);
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalKm = completedTrips.reduce(
    (sum, t) => sum + (t.distanceKm ?? 0),
    0,
  );

  const dayCount = Math.max(1, Math.ceil((endDate - startDate) / 86400));
  const avgDailyEarnings = totalEarnings / dayCount;
  const avgTripEarnings =
    completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0;
  const avgTripDistanceKm =
    completedTrips.length > 0 ? totalKm / completedTrips.length : 0;

  return {
    startDate,
    endDate,
    totalEarnings,
    totalFuelCost,
    totalExpenses,
    netEarnings: calculateNetEarnings(totalEarnings, totalFuelCost, totalExpenses),
    totalTrips: periodTrips.length,
    completedTrips: completedTrips.length,
    totalKm,
    fuelCostPerKm: calculateFuelCostPerKm(totalFuelCost, totalKm),
    avgDailyEarnings,
    avgTripEarnings,
    avgTripDistanceKm,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verilen Unix timestamp için günün başlangıcını (00:00:00 UTC) döner.
 * @param timestamp - Unix timestamp (saniye)
 * @returns Günün başı Unix timestamp
 */
function getStartOfDay(timestamp: number): number {
  const d = new Date(timestamp * 1000);
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}
