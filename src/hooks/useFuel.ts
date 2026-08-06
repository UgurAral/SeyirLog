import { useEffect, useMemo } from 'react';
import { useFuelStore } from '@stores/fuelStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { sumByCurrency } from '@utils/calculations';
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
  } = useFuelStore();
  const activeCurrency = useCurrencyStore((s) => s.currency);

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

  const totalCostByCurrency = useMemo(
    () => sumByCurrency(vehicleFiltered, (f) => f.totalCost),
    [vehicleFiltered],
  );
  const totalCost = totalCostByCurrency[activeCurrency] ?? 0;

  const litersByCurrency = useMemo(
    () => sumByCurrency(vehicleFiltered, (f) => f.liters),
    [vehicleFiltered],
  );
  const avgPricePerLiterByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    for (const currency of Object.keys(totalCostByCurrency)) {
      const liters = litersByCurrency[currency] ?? 0;
      result[currency] = liters > 0 ? totalCostByCurrency[currency] / liters : 0;
    }
    return result;
  }, [totalCostByCurrency, litersByCurrency]);
  const avgPricePerLiter = avgPricePerLiterByCurrency[activeCurrency] ?? 0;

  const lastEntry = vehicleFiltered[0] ?? null;

  // Dönem istatistikleri
  const periodLiters = useMemo(
    () => filteredEntries.reduce((sum, f) => sum + f.liters, 0),
    [filteredEntries],
  );

  const periodCostByCurrency = useMemo(
    () => sumByCurrency(filteredEntries, (f) => f.totalCost),
    [filteredEntries],
  );
  const periodCost = periodCostByCurrency[activeCurrency] ?? 0;

  return {
    fuelEntries: vehicleFiltered,
    filteredEntries,
    isLoading,
    error,
    totalLiters,
    totalCost,
    totalCostByCurrency,
    avgPricePerLiter,
    avgPricePerLiterByCurrency,
    lastEntry,
    periodLiters,
    periodCost,
    periodCostByCurrency,
    addFuelEntry,
    updateFuelEntry,
    deleteFuelEntry,
  };
}
