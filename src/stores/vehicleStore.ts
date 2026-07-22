import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { vehicles } from '@db/schema';
import type { Vehicle, NewVehicle } from '@types/index';

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
  },

  deleteVehicle: async (id) => {
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
  },
}));
