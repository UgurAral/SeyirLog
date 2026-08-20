import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { vehicles, trips, fuelEntries, expenses, incomeEntries } from '@db/schema';
import { syncUpsert, syncDelete } from '@services/firestore';
import { useTripStore } from '@stores/tripStore';
import { useFuelStore } from '@stores/fuelStore';
import { useExpenseStore } from '@stores/expenseStore';
import { useIncomeStore } from '@stores/incomeStore';
import type { Vehicle, NewVehicle } from '@/types';

interface VehicleStore {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;

  fetchVehicles: () => Promise<void>;
  setActiveVehicle: (vehicle: Vehicle) => void;
  addVehicle: (
    vehicle: Omit<NewVehicle, 'createdAt' | 'updatedAt'>,
  ) => Promise<Vehicle>;
  updateVehicle: (id: number, data: Partial<NewVehicle>) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  activeVehicle: null,
  isLoading: false,
  error: null,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await db
        .select()
        .from(vehicles)
        .orderBy(desc(vehicles.createdAt));
      set({ vehicles: result, isLoading: false });
      // Otomatik olarak ilk aktif aracı seç (sadece henüz seçili değilse)
      if (!get().activeVehicle && result.length > 0) {
        const active = result.find((v) => v.isActive === 1) ?? result[0];
        set({ activeVehicle: active });
      }
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  setActiveVehicle: (vehicle: Vehicle) => {
    set({ activeVehicle: vehicle });
  },

  addVehicle: async (vehicleData) => {
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .insert(vehicles)
      .values({ ...vehicleData, createdAt: now, updatedAt: now })
      .returning();
    const inserted = result[0];
    set((state) => ({
      vehicles: [inserted, ...state.vehicles],
      // İlk araçsa otomatik aktif yap
      activeVehicle: state.activeVehicle ?? inserted,
    }));
    syncUpsert('vehicles', inserted.id, inserted);
    return inserted;
  },

  updateVehicle: async (id, data) => {
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(vehicles)
      .set({ ...data, updatedAt: now })
      .where(eq(vehicles.id, id));
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, ...data, updatedAt: now } : v,
      ),
      activeVehicle:
        state.activeVehicle?.id === id
          ? { ...state.activeVehicle, ...data, updatedAt: now }
          : state.activeVehicle,
    }));
    syncUpsert('vehicles', id, { ...data, updatedAt: now });
  },

  deleteVehicle: async (id) => {
    // Araca bağlı sefer/yakıt/gider/gelir kayıtları FK ile referans veriyor
    // ama cascade delete yok — önce bunları (yerel + Firestore) temizlemezsek
    // araç silindikten sonra bu kayıtlara hiçbir ekrandan erişilemez, kalıcı
    // yetim veri olarak DB'de birikirler. day_sessions kasıtlı olarak
    // dokunulmuyor (accountDeletion.ts'teki gibi — vardiya geçmişi araç
    // silinse de korunuyor, day-history.tsx eksik aracı zaten güvenli işliyor).
    const [relatedTrips, relatedFuel, relatedExpenses, relatedIncome] = await Promise.all([
      db.select({ id: trips.id }).from(trips).where(eq(trips.vehicleId, id)),
      db.select({ id: fuelEntries.id }).from(fuelEntries).where(eq(fuelEntries.vehicleId, id)),
      db.select({ id: expenses.id }).from(expenses).where(eq(expenses.vehicleId, id)),
      db.select({ id: incomeEntries.id }).from(incomeEntries).where(eq(incomeEntries.vehicleId, id)),
    ]);

    await db.delete(expenses).where(eq(expenses.vehicleId, id));
    await db.delete(incomeEntries).where(eq(incomeEntries.vehicleId, id));
    await db.delete(fuelEntries).where(eq(fuelEntries.vehicleId, id));
    await db.delete(trips).where(eq(trips.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));

    set((state) => {
      const remaining = state.vehicles.filter((v) => v.id !== id);
      return {
        vehicles: remaining,
        activeVehicle:
          state.activeVehicle?.id === id
            ? (remaining[0] ?? null)
            : state.activeVehicle,
      };
    });

    relatedExpenses.forEach((r) => syncDelete('expenses', r.id));
    relatedIncome.forEach((r) => syncDelete('income_entries', r.id));
    relatedFuel.forEach((r) => syncDelete('fuel_entries', r.id));
    relatedTrips.forEach((r) => syncDelete('trips', r.id));
    syncDelete('vehicles', id);

    await Promise.all([
      useTripStore.getState().fetchTrips(),
      useFuelStore.getState().fetchFuelEntries(),
      useExpenseStore.getState().fetchExpenses(),
      useIncomeStore.getState().fetchEntries(),
    ]);
  },
}));
