import { useEffect, useCallback, useMemo } from 'react';
import { useTripStore } from '@stores/tripStore';
import { calculatePeriodStats, calculateDailyStats } from '@utils/calculations';
import { useFuelStore } from '@stores/fuelStore';
import { useExpenseStore } from '@stores/expenseStore';
import { isInPeriod } from '@utils/dateHelpers';

export type TripPeriod = 'today' | 'week' | 'month' | 'all';

/**
 * Sefer verilerini ve ilgili yardımcı fonksiyonları sağlayan hook.
 * @param vehicleId - İsteğe bağlı filtre için araç ID'si
 * @param period - Dönem filtresi: 'today' | 'week' | 'month' | 'all'
 */
export function useTrips(vehicleId?: number, period: TripPeriod = 'all') {
  const {
    trips,
    activeTrip,
    isLoading,
    error,
    fetchTrips,
    fetchActiveTrip,
    addTrip,
    updateTrip,
    completeTrip,
    cancelTrip,
    deleteTrip,
  } = useTripStore();

  const { fuelEntries } = useFuelStore();
  const { expenses } = useExpenseStore();

  useEffect(() => {
    fetchTrips(vehicleId);
    if (vehicleId !== undefined) {
      fetchActiveTrip(vehicleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const getDailyStats = useCallback(
    (date: number) => {
      const filtered = vehicleId
        ? trips.filter((t) => t.vehicleId === vehicleId)
        : trips;
      const filteredFuel = vehicleId
        ? fuelEntries.filter((f) => f.vehicleId === vehicleId)
        : fuelEntries;
      const filteredExpenses = vehicleId
        ? expenses.filter((e) => e.vehicleId === vehicleId)
        : expenses;
      return calculateDailyStats(filtered, filteredFuel, filteredExpenses, date);
    },
    [trips, fuelEntries, expenses, vehicleId],
  );

  const getPeriodStats = useCallback(
    (startDate: number, endDate: number) => {
      const filtered = vehicleId
        ? trips.filter((t) => t.vehicleId === vehicleId)
        : trips;
      const filteredFuel = vehicleId
        ? fuelEntries.filter((f) => f.vehicleId === vehicleId)
        : fuelEntries;
      const filteredExpenses = vehicleId
        ? expenses.filter((e) => e.vehicleId === vehicleId)
        : expenses;
      return calculatePeriodStats(
        filtered,
        filteredFuel,
        filteredExpenses,
        startDate,
        endDate,
      );
    },
    [trips, fuelEntries, expenses, vehicleId],
  );

  // Araç filtresi
  const vehicleFiltered = useMemo(
    () =>
      vehicleId ? trips.filter((t) => t.vehicleId === vehicleId) : trips,
    [trips, vehicleId],
  );

  // Dönem filtresi
  const filteredTrips = useMemo(() => {
    if (period === 'all') return vehicleFiltered;
    return vehicleFiltered.filter((t) => isInPeriod(t.startTime, period));
  }, [vehicleFiltered, period]);

  const completedTrips = useMemo(
    () => vehicleFiltered.filter((t) => t.status === 'completed'),
    [vehicleFiltered],
  );

  const totalEarnings = useMemo(
    () => completedTrips.reduce((sum, t) => sum + (t.earnings ?? 0), 0),
    [completedTrips],
  );

  // Dönem istatistikleri
  const periodCompleted = useMemo(
    () => filteredTrips.filter((t) => t.status === 'completed'),
    [filteredTrips],
  );

  const periodEarnings = useMemo(
    () => periodCompleted.reduce((sum, t) => sum + (t.earnings ?? 0), 0),
    [periodCompleted],
  );

  const periodKm = useMemo(
    () => periodCompleted.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0),
    [periodCompleted],
  );

  const periodCount = filteredTrips.length;

  return {
    trips: vehicleFiltered,
    filteredTrips,
    activeTrip,
    completedTrips,
    totalEarnings,
    isLoading,
    error,
    periodEarnings,
    periodKm,
    periodCount,
    addTrip,
    updateTrip,
    completeTrip,
    cancelTrip,
    deleteTrip,
    getDailyStats,
    getPeriodStats,
  };
}
