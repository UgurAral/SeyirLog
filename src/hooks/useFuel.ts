import { useEffect, useMemo } from 'react';
import { useFuelStore } from '@stores/fuelStore';
import { isInPeriod } from '@utils/dateHelpers';

export type FuelPeriod = 'today' | 'week' | 'month' | 'all';

/**
 * Yakıt verilerini ve istatistiklerini sağlayan hook.
 * @param vehicleId - İsteğe bağlı filtre için araç ID'si
 * @param period - Dönem filtresi: 'today' | 'week' | 'month' | 'all'
 */
export function useFuel(vehicleId?: number, period: FuelPeriod = 'all') {
  const {
    fuelEntries,
    isLoading,
    error,
    fetchFuelEntries,
    addFuelEntry,
    updateFuelEntry,
    deleteFuelEntry,
    getTotalFuelCost,
  } = useFuelStore();

  useEffect(() => {
    fetchFuelEntries(vehicleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  // Araç filtresi
  const vehicleFiltered = useMemo(
    () =>
      vehicleId ? fuelEntries.filter((f) => f.vehicleId === vehicleId) : fuelEntries,
    [fuelEntries, vehicleId],
  );

  // Dönem filtresi
  const filteredEntries = useMemo(() => {
    if (period === 'all') return vehicleFiltered;
    return vehicleFiltered.filter((f) => isInPeriod(f.date, period));
  }, [vehicleFiltered, period]);

  const totalLiters = useMemo(
    () => vehicleFiltered.reduce((sum, f) => sum + f.liters, 0),
    [vehicleFiltered],
  );

  const totalCost = getTotalFuelCost(vehicleId);

  const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

  const lastEntry = vehicleFiltered[0] ?? null;

  // Dönem istatistikleri
  const periodLiters = useMemo(
    () => filteredEntries.reduce((sum, f) => sum + f.liters, 0),
    [filteredEntries],
  );

  const periodCost = useMemo(
    () => filteredEntries.reduce((sum, f) => sum + f.totalCost, 0),
    [filteredEntries],
  );

  return {
    fuelEntries: vehicleFiltered,
    filteredEntries,
    isLoading,
    error,
    totalLiters,
    totalCost,
    avgPricePerLiter,
    lastEntry,
    periodLiters,
    periodCost,
    addFuelEntry,
    updateFuelEntry,
    deleteFuelEntry,
  };
}
