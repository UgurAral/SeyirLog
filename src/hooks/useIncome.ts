import { useEffect, useMemo } from 'react';
import { useIncomeStore } from '@stores/incomeStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { sumByCurrency } from '@utils/calculations';
import { isInPeriod } from '@utils/dateHelpers';

export type IncomePeriod = 'today' | 'last24h' | 'week' | 'month' | 'all';

/**
 * Gelir kayıtlarını otomatik olarak yükler ve incomeStore'u expose eder.
 * @param vehicleId - Opsiyonel araç ID filtresi. Verilirse sadece o aracın gelirlerini yükler.
 * @param period - Dönem filtresi: 'today' | 'week' | 'month' | 'all'
 */
export function useIncome(vehicleId?: number, period: IncomePeriod = 'all') {
  const store = useIncomeStore();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  useEffect(() => {
    store.fetchEntries(vehicleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  // Araç filtresi — store tüm ekranlarca paylaşılan tek bir global entries
  // dizisi tuttuğu için (örn. day-history/day-summary vehicleId=undefined ile
  // fetchEntries çağırıp diziyi tüm araçlarla dolduruyor), burada da diğer
  // useTrips/useExpenses/useFuel hook'larındaki gibi client-side filtre
  // uygulanmazsa başka bir ekranın tetiklediği fetch, mevcut aracın gelir
  // listesine yabancı kayıtlar sızdırabilir.
  const vehicleFiltered = useMemo(
    () =>
      vehicleId ? store.entries.filter((e) => e.vehicleId === vehicleId) : store.entries,
    [store.entries, vehicleId],
  );

  const filteredEntries = useMemo(() => {
    if (period === 'all') return vehicleFiltered;
    return vehicleFiltered.filter((e) => isInPeriod(e.date, period));
  }, [vehicleFiltered, period]);

  const periodTotalByCurrency = useMemo(
    () => sumByCurrency(filteredEntries, (e) => e.amount),
    [filteredEntries],
  );
  const periodTotal = periodTotalByCurrency[activeCurrency] ?? 0;

  const totalAmountByCurrency = useMemo(
    () => sumByCurrency(vehicleFiltered, (e) => e.amount),
    [vehicleFiltered],
  );
  const totalAmount = vehicleId
    ? totalAmountByCurrency[activeCurrency] ?? 0
    : store.getTotalAmount(activeCurrency);

  return {
    ...store,
    entries: vehicleFiltered,
    filteredEntries,
    periodTotal,
    periodTotalByCurrency,
    totalAmount,
    totalAmountByCurrency,
  };
}
