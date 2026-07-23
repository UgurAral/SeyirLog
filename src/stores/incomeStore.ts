import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { incomeEntries } from '@db/schema';
import type { IncomeEntry, NewIncomeEntry } from '@/types';

interface IncomeStore {
  entries: IncomeEntry[];
  totalAmount: number;
  isLoading: boolean;
  error: string | null;

  fetchEntries: (vehicleId?: number) => Promise<void>;
  addEntry: (
    entry: Omit<NewIncomeEntry, 'createdAt' | 'updatedAt'>,
  ) => Promise<IncomeEntry>;
  deleteEntry: (id: number) => Promise<void>;
}

export const useIncomeStore = create<IncomeStore>((set) => ({
  entries: [],
  totalAmount: 0,
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

      const total = result.reduce((sum, e) => sum + e.amount, 0);
      set({ entries: result, totalAmount: total, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addEntry: async (entryData) => {
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .insert(incomeEntries)
      .values({ ...entryData, createdAt: now, updatedAt: now })
      .returning();
    const inserted = result[0];
    set((state) => ({
      entries: [inserted, ...state.entries],
      totalAmount: state.totalAmount + inserted.amount,
    }));
    return inserted;
  },

  deleteEntry: async (id) => {
    const rows = await db
      .select()
      .from(incomeEntries)
      .where(eq(incomeEntries.id, id));
    const entry = rows[0];
    await db.delete(incomeEntries).where(eq(incomeEntries.id, id));
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      totalAmount: state.totalAmount - (entry?.amount ?? 0),
    }));
  },
}));
