import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { fuelEntries } from '@db/schema';
import { syncUpsert, syncDelete } from '@services/firestore';
import { useCurrencyStore } from '@stores/currencyStore';
import type { FuelEntry, NewFuelEntry } from '@/types';

interface FuelStore {
  fuelEntries: FuelEntry[];
  isLoading: boolean;
  error: string | null;

  fetchFuelEntries: (vehicleId?: number) => Promise<void>;
  addFuelEntry: (entry: NewFuelEntry) => Promise<FuelEntry>;
  updateFuelEntry: (id: number, data: Partial<NewFuelEntry>) => Promise<void>;
  deleteFuelEntry: (id: number) => Promise<void>;
  getTotalFuelCost: (vehicleId?: number, currency?: string) => number;
}

export const useFuelStore = create<FuelStore>((set, get) => ({
  fuelEntries: [],
  isLoading: false,
  error: null,

  fetchFuelEntries: async (vehicleId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = vehicleId
        ? await db
            .select()
            .from(fuelEntries)
            .where(eq(fuelEntries.vehicleId, vehicleId))
            .orderBy(desc(fuelEntries.date))
        : await db.select().from(fuelEntries).orderBy(desc(fuelEntries.date));
      set({ fuelEntries: result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addFuelEntry: async (entry: NewFuelEntry) => {
    const now = Math.floor(Date.now() / 1000);
    const newEntry = {
      ...entry,
      currency: useCurrencyStore.getState().currency,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.insert(fuelEntries).values(newEntry).returning();
    const inserted = result[0];
    set((state) => ({ fuelEntries: [inserted, ...state.fuelEntries] }));
    syncUpsert('fuel_entries', inserted.id, inserted);
    return inserted;
  },

  updateFuelEntry: async (id: number, data: Partial<NewFuelEntry>) => {
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(fuelEntries)
      .set({ ...data, updatedAt: now })
      .where(eq(fuelEntries.id, id));
    set((state) => ({
      fuelEntries: state.fuelEntries.map((f) =>
        f.id === id ? { ...f, ...data, updatedAt: now } : f,
      ),
    }));
    syncUpsert('fuel_entries', id, { ...data, updatedAt: now });
  },

  deleteFuelEntry: async (id: number) => {
    await db.delete(fuelEntries).where(eq(fuelEntries.id, id));
    set((state) => ({
      fuelEntries: state.fuelEntries.filter((f) => f.id !== id),
    }));
    syncDelete('fuel_entries', id);
  },

  getTotalFuelCost: (vehicleId?: number, currency?: string) => {
    let entries = vehicleId
      ? get().fuelEntries.filter((f) => f.vehicleId === vehicleId)
      : get().fuelEntries;
    if (currency) entries = entries.filter((f) => f.currency === currency);
    return entries.reduce((sum, f) => sum + f.totalCost, 0);
  },
}));
