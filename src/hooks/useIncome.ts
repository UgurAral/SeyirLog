import { useEffect } from 'react';
import { useIncomeStore } from '@stores/incomeStore';

/**
 * Gelir kayıtlarını otomatik olarak yükler ve incomeStore'u expose eder.
 * @param vehicleId - Opsiyonel araç ID filtresi. Verilirse sadece o aracın gelirlerini yükler.
 */
export function useIncome(vehicleId?: number) {
  const store = useIncomeStore();

  useEffect(() => {
    store.fetchEntries(vehicleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  return store;
}
