import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { fuelEntries } from '@db/schema';
import type { FuelEntry, NewFuelEntry } from '@/types';

interface FuelStore {
  fuelEntries: FuelEntry[];
  isLoading: boolean;
  error: string | null;

  fetchFuelEntries: (vehicleId?: number) => Promise<void>;
  addFuelEntry: (entry: NewFuelEntry) => Promise<FuelEntry>;
  updateFuelEntry: (id: number, data: Partial<NewFuelEntry>) => Promise<void>;
  deleteFuelEntry: (id: number) => Promise<void>;
  getTotalFuelCost: (vehicleId?: number) => number;
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
    const newEntry = { ...entry, createdAt: now, updatedAt: now };
    const result = await db.insert(fuelEntries).values(newEntry).returning();
    const inserted = result[0];
    set((state) => ({ fuelEntries: [inserted, ...state.fuelEntries] }));
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
  },

  deleteFuelEntry: async (id: number) => {
    await db.delete(fuelEntries).where(eq(fuelEntries.id, id));
    set((state) => ({
      fuelEntries: state.fuelEntries.filter((f) => f.id !== id),
    }));
  },

  getTotalFuelCost: (vehicleId?: number) => {
    const entries = vehicleId
      ? get().fuelEntries.filter((f) => f.vehicleId === vehicleId)
      : get().fuelEntries;
    return entries.reduce((sum, f) => sum + f.totalCost, 0);
  },
}));
