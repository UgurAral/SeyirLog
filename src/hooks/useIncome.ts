import { useEffect, useMemo } from 'react';
import { useIncomeStore } from '@stores/incomeStore';
import { isInPeriod } from '@utils/dateHelpers';

export type IncomePeriod = 'today' | 'week' | 'month' | 'all';

/**
 * Gelir kayıtlarını otomatik olarak yükler ve incomeStore'u expose eder.
 * @param vehicleId - Opsiyonel araç ID filtresi. Verilirse sadece o aracın gelirlerini yükler.
 * @param period - Dönem filtresi: 'today' | 'week' | 'month' | 'all'
 */
export function useIncome(vehicleId?: number, period: IncomePeriod = 'all') {
  const store = useIncomeStore();

  useEffect(() => {
    store.fetchEntries(vehicleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const filteredEntries = useMemo(() => {
    if (period === 'all') return store.entries;
    return store.entries.filter((e) => isInPeriod(e.date, period));
  }, [store.entries, period]);

  const periodTotal = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.amount, 0),
    [filteredEntries],
  );

  return { ...store, filteredEntries, periodTotal };
}
