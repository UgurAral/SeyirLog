import { useEffect, useMemo } from 'react';
import { useExpenseStore } from '@stores/expenseStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { sumByCurrency } from '@utils/calculations';
import { isInPeriod } from '@utils/dateHelpers';
import type { ExpenseCategory } from '@/types';

export type ExpensePeriod = 'today' | 'last24h' | 'week' | 'month' | 'all';

/**
 * Gider verilerini ve kategorilere göre istatistikleri sağlayan hook.
 * @param vehicleId - İsteğe bağlı filtre için araç ID'si
 * @param period - Dönem filtresi: 'today' | 'week' | 'month' | 'all'
 */
export function useExpenses(vehicleId?: number, period: ExpensePeriod = 'all') {
  const {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getTotalExpenses,
    getExpensesByCategory,
  } = useExpenseStore();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  useEffect(() => {
    fetchExpenses(vehicleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  // Araç filtresi
  const vehicleFiltered = useMemo(
    () =>
      vehicleId ? expenses.filter((e) => e.vehicleId === vehicleId) : expenses,
    [expenses, vehicleId],
  );

  // Dönem filtresi
  const filteredExpenses = useMemo(() => {
    if (period === 'all') return vehicleFiltered;
    return vehicleFiltered.filter((e) => isInPeriod(e.date, period));
  }, [vehicleFiltered, period]);

  const totalAmountByCurrency = useMemo(
    () => sumByCurrency(vehicleFiltered, (e) => e.amount),
    [vehicleFiltered],
  );
  const totalAmount = getTotalExpenses(vehicleId, activeCurrency);
  const byCategory = getExpensesByCategory(vehicleId, activeCurrency);
  const lastExpense = vehicleFiltered[0] ?? null;

  // Dönem istatistikleri (sadece aktif para birimi)
  const currencyFilteredPeriod = useMemo(
    () => filteredExpenses.filter((e) => e.currency === activeCurrency),
    [filteredExpenses, activeCurrency],
  );

  const periodTotalByCurrency = useMemo(
    () => sumByCurrency(filteredExpenses, (e) => e.amount),
    [filteredExpenses],
  );
  const periodTotal = periodTotalByCurrency[activeCurrency] ?? 0;

  // Dönem kategori gruplandırması
  const periodByCategory = useMemo(() => {
    const initial: Record<ExpenseCategory, number> = {
      bridge: 0,
      parking: 0,
      maintenance: 0,
      fine: 0,
      tire: 0,
      wash: 0,
      other: 0,
    };
    return currencyFilteredPeriod.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, initial);
  }, [currencyFilteredPeriod]);

  return {
    expenses: vehicleFiltered,
    filteredExpenses,
    isLoading,
    error,
    totalAmount,
    totalAmountByCurrency,
    byCategory,
    lastExpense,
    periodTotal,
    periodTotalByCurrency,
    periodByCategory,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
