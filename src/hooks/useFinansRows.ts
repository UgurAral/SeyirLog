import { useMemo } from 'react';
import { useIncome } from './useIncome';
import { useTrips } from './useTrips';
import { useExpenses } from './useExpenses';
import { useFuel } from './useFuel';
import type { Trip, IncomeEntry, Expense, FuelEntry } from '@/types';

export type IncomeRow =
  | { kind: 'trip'; id: number; date: number; amount: number; currency: string; trip: Trip }
  | { kind: 'income'; id: number; date: number; amount: number; currency: string; entry: IncomeEntry };

export type ExpenseRow =
  | { kind: 'fuel'; id: number; date: number; amount: number; currency: string; entry: FuelEntry }
  | { kind: 'expense'; id: number; date: number; amount: number; currency: string; entry: Expense };

/**
 * Tamamlanmış sefer kazançlarını (trips.earnings) ve manuel gelir kayıtlarını
 * (income_entries) tarihe göre sıralı, tek bir listede birleştirir. Finans
 * ekranı, hedef kartı ve trend grafiği aynı "gerçek gelir" tanımını paylaşsın
 * diye tek yerde toplanır.
 */
export function useIncomeRows(vehicleId?: number) {
  const { entries, isLoading: incomeLoading } = useIncome(vehicleId);
  const { completedTrips, isLoading: tripsLoading } = useTrips(vehicleId);

  const rows = useMemo<IncomeRow[]>(() => {
    const tripRows: IncomeRow[] = completedTrips
      .filter((tr) => tr.earnings != null && tr.earnings > 0)
      .map((tr) => ({
        kind: 'trip',
        id: tr.id,
        date: tr.endTime ?? tr.startTime,
        amount: tr.earnings as number,
        currency: tr.currency,
        trip: tr,
      }));
    const incomeRows: IncomeRow[] = entries.map((e) => ({
      kind: 'income',
      id: e.id,
      date: e.date,
      amount: e.amount,
      currency: e.currency,
      entry: e,
    }));
    return [...tripRows, ...incomeRows].sort((a, b) => b.date - a.date);
  }, [completedTrips, entries]);

  return { rows, isLoading: incomeLoading || tripsLoading };
}

/**
 * Yakıt kayıtlarını (fuel_entries) ve diğer giderleri (expenses) tarihe göre
 * sıralı, tek bir listede birleştirir. bkz. useIncomeRows.
 */
export function useExpenseRows(vehicleId?: number) {
  const { expenses, isLoading: expensesLoading } = useExpenses(vehicleId);
  const { fuelEntries, isLoading: fuelLoading } = useFuel(vehicleId);

  const rows = useMemo<ExpenseRow[]>(() => {
    const fuelRows: ExpenseRow[] = fuelEntries.map((f) => ({
      kind: 'fuel',
      id: f.id,
      date: f.date,
      amount: f.totalCost,
      currency: f.currency,
      entry: f,
    }));
    const expenseRows: ExpenseRow[] = expenses.map((e) => ({
      kind: 'expense',
      id: e.id,
      date: e.date,
      amount: e.amount,
      currency: e.currency,
      entry: e,
    }));
    return [...fuelRows, ...expenseRows].sort((a, b) => b.date - a.date);
  }, [fuelEntries, expenses]);

  return { rows, isLoading: expensesLoading || fuelLoading };
}
