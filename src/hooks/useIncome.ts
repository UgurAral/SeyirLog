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

  const filteredEntries = useMemo(() => {
    if (period === 'all') return store.entries;
    return store.entries.filter((e) => isInPeriod(e.date, period));
  }, [store.entries, period]);

  const periodTotalByCurrency = useMemo(
    () => sumByCurrency(filteredEntries, (e) => e.amount),
    [filteredEntries],
  );
  const periodTotal = periodTotalByCurrency[activeCurrency] ?? 0;

  const totalAmountByCurrency = useMemo(
    () => sumByCurrency(store.entries, (e) => e.amount),
    [store.entries],
  );
  const totalAmount = store.getTotalAmount(activeCurrency);

  return {
    ...store,
    filteredEntries,
    periodTotal,
    periodTotalByCurrency,
    totalAmount,
    totalAmountByCurrency,
  };
}
