import { useEffect, useMemo } from 'react';
import { useExpenseStore } from '@stores/expenseStore';
import { isInPeriod } from '@utils/dateHelpers';
import type { ExpenseCategory } from '@types/index';

export type ExpensePeriod = 'today' | 'week' | 'month' | 'all';

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

  const totalAmount = getTotalExpenses(vehicleId);
  const byCategory = getExpensesByCategory(vehicleId);
  const lastExpense = vehicleFiltered[0] ?? null;

  // Dönem istatistikleri
  const periodTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

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
    return filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, initial);
  }, [filteredExpenses]);

  return {
    expenses: vehicleFiltered,
    filteredExpenses,
    isLoading,
    error,
    totalAmount,
    byCategory,
    lastExpense,
    periodTotal,
    periodByCategory,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
