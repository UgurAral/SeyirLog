import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { expenses } from '@db/schema';
import { syncUpsert, syncDelete } from '@services/firestore';
import { useCurrencyStore } from '@stores/currencyStore';
import type { Expense, NewExpense, ExpenseCategory } from '@/types';

interface ExpenseStore {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;

  fetchExpenses: (vehicleId?: number) => Promise<void>;
  addExpense: (expense: NewExpense) => Promise<Expense>;
  updateExpense: (id: number, data: Partial<NewExpense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  getTotalExpenses: (vehicleId?: number, currency?: string) => number;
  getExpensesByCategory: (
    vehicleId?: number,
    currency?: string,
  ) => Record<ExpenseCategory, number>;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (vehicleId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = vehicleId
        ? await db
            .select()
            .from(expenses)
            .where(eq(expenses.vehicleId, vehicleId))
            .orderBy(desc(expenses.date))
        : await db.select().from(expenses).orderBy(desc(expenses.date));
      set({ expenses: result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addExpense: async (expense: NewExpense) => {
    const now = Math.floor(Date.now() / 1000);
    const newExpense = {
      ...expense,
      currency: useCurrencyStore.getState().currency,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.insert(expenses).values(newExpense).returning();
    const inserted = result[0];
    set((state) => ({ expenses: [inserted, ...state.expenses] }));
    syncUpsert('expenses', inserted.id, inserted);
    return inserted;
  },

  updateExpense: async (id: number, data: Partial<NewExpense>) => {
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(expenses)
      .set({ ...data, updatedAt: now })
      .where(eq(expenses.id, id));
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...data, updatedAt: now } : e,
      ),
    }));
    syncUpsert('expenses', id, { ...data, updatedAt: now });
  },

  deleteExpense: async (id: number) => {
    await db.delete(expenses).where(eq(expenses.id, id));
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
    syncDelete('expenses', id);
  },

  getTotalExpenses: (vehicleId?: number, currency?: string) => {
    let list = vehicleId
      ? get().expenses.filter((e) => e.vehicleId === vehicleId)
      : get().expenses;
    if (currency) list = list.filter((e) => e.currency === currency);
    return list.reduce((sum, e) => sum + e.amount, 0);
  },

  getExpensesByCategory: (vehicleId?: number, currency?: string) => {
    let list = vehicleId
      ? get().expenses.filter((e) => e.vehicleId === vehicleId)
      : get().expenses;
    if (currency) list = list.filter((e) => e.currency === currency);

    const initial: Record<ExpenseCategory, number> = {
      bridge: 0,
      parking: 0,
      maintenance: 0,
      fine: 0,
      tire: 0,
      wash: 0,
      other: 0,
    };

    return list.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, initial);
  },
}));
