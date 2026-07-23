import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { trips } from '@db/schema';
import type { Trip, NewTrip } from '@/types';

interface TripStore {
  trips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;
  error: string | null;

  fetchTrips: (vehicleId?: number) => Promise<void>;
  fetchActiveTrip: (vehicleId: number) => Promise<void>;
  addTrip: (trip: NewTrip) => Promise<Trip>;
  updateTrip: (id: number, data: Partial<NewTrip>) => Promise<void>;
  completeTrip: (
    id: number,
    endKm: number,
    endTime: number,
    earnings: number,
  ) => Promise<void>;
  cancelTrip: (id: number) => Promise<void>;
  deleteTrip: (id: number) => Promise<void>;
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  activeTrip: null,
  isLoading: false,
  error: null,

  fetchTrips: async (vehicleId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = vehicleId
        ? await db
            .select()
            .from(trips)
            .where(eq(trips.vehicleId, vehicleId))
            .orderBy(desc(trips.startTime))
        : await db.select().from(trips).orderBy(desc(trips.startTime));
      set({ trips: result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  fetchActiveTrip: async (vehicleId: number) => {
    try {
      const result = await db
        .select()
        .from(trips)
        .where(eq(trips.vehicleId, vehicleId))
        .orderBy(desc(trips.startTime))
        .limit(1);
      const trip = result[0] ?? null;
      set({ activeTrip: trip?.status === 'active' ? trip : null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  addTrip: async (trip: NewTrip) => {
    const now = Math.floor(Date.now() / 1000);
    const newTrip = { ...trip, createdAt: now, updatedAt: now };
    const result = await db.insert(trips).values(newTrip).returning();
    const inserted = result[0];
    set((state) => ({ trips: [inserted, ...state.trips] }));
    if (inserted.status === 'active') {
      set({ activeTrip: inserted });
    }
    return inserted;
  },

  updateTrip: async (id: number, data: Partial<NewTrip>) => {
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(trips)
      .set({ ...data, updatedAt: now })
      .where(eq(trips.id, id));
    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: now } : t,
      ),
      activeTrip:
        state.activeTrip?.id === id
          ? { ...state.activeTrip, ...data, updatedAt: now }
          : state.activeTrip,
    }));
  },

  completeTrip: async (
    id: number,
    endKm: number,
    endTime: number,
    earnings: number,
  ) => {
    const now = Math.floor(Date.now() / 1000);
    const trip = get().trips.find((t) => t.id === id);
    const distanceKm = trip ? endKm - trip.startKm : undefined;
    const durationMinutes = trip
      ? Math.floor((endTime - trip.startTime) / 60)
      : undefined;

    await db
      .update(trips)
      .set({
        endKm,
        endTime,
        earnings,
        distanceKm,
        durationMinutes,
        status: 'completed',
        updatedAt: now,
      })
      .where(eq(trips.id, id));

    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === id
          ? {
              ...t,
              endKm,
              endTime,
              earnings,
              distanceKm: distanceKm ?? t.distanceKm,
              durationMinutes: durationMinutes ?? t.durationMinutes,
              status: 'completed',
              updatedAt: now,
            }
          : t,
      ),
      activeTrip: null,
    }));
  },

  cancelTrip: async (id: number) => {
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(trips)
      .set({ status: 'cancelled', updatedAt: now })
      .where(eq(trips.id, id));
    set((state) => ({
      trips: state.trips.map((t) =>
        t.id === id ? { ...t, status: 'cancelled', updatedAt: now } : t,
      ),
      activeTrip: state.activeTrip?.id === id ? null : state.activeTrip,
    }));
  },

  deleteTrip: async (id: number) => {
    await db.delete(trips).where(eq(trips.id, id));
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      activeTrip: state.activeTrip?.id === id ? null : state.activeTrip,
    }));
  },
}));
