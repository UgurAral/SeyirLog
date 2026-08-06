import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { incomeEntries } from '@db/schema';
import { syncUpsert, syncDelete } from '@services/firestore';
import { useCurrencyStore } from '@stores/currencyStore';
import type { IncomeEntry, NewIncomeEntry } from '@/types';

interface IncomeStore {
  entries: IncomeEntry[];
  isLoading: boolean;
  error: string | null;

  fetchEntries: (vehicleId?: number) => Promise<void>;
  addEntry: (
    entry: Omit<NewIncomeEntry, 'createdAt' | 'updatedAt'>,
  ) => Promise<IncomeEntry>;
  deleteEntry: (id: number) => Promise<void>;
  getTotalAmount: (currency?: string) => number;
}

export const useIncomeStore = create<IncomeStore>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchEntries: async (vehicleId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = vehicleId
        ? await db
            .select()
            .from(incomeEntries)
            .where(eq(incomeEntries.vehicleId, vehicleId))
            .orderBy(desc(incomeEntries.date))
        : await db
            .select()
            .from(incomeEntries)
            .orderBy(desc(incomeEntries.date));

      set({ entries: result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addEntry: async (entryData) => {
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .insert(incomeEntries)
      .values({
        ...entryData,
        currency: useCurrencyStore.getState().currency,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const inserted = result[0];
    set((state) => ({ entries: [inserted, ...state.entries] }));
    syncUpsert('income_entries', inserted.id, inserted);
    return inserted;
  },

  deleteEntry: async (id) => {
    await db.delete(incomeEntries).where(eq(incomeEntries.id, id));
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
    syncDelete('income_entries', id);
  },

  getTotalAmount: (currency?: string) => {
    const list = currency
      ? get().entries.filter((e) => e.currency === currency)
      : get().entries;
    return list.reduce((sum, e) => sum + e.amount, 0);
  },
}));
