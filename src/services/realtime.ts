/**
 * realtime.ts — Firestore gerçek zamanlı dinleyiciler
 * Aynı hesapla 2. cihazda değişiklik olunca store'lar anında güncellenir.
 */

import { listenCollection } from '@services/firestore';
import { upsertRows } from '@services/sync';
import { vehicles, trips, fuelEntries, expenses, incomeEntries } from '@db/schema';
import { useTripStore } from '@stores/tripStore';
import { useFuelStore } from '@stores/fuelStore';
import { useExpenseStore } from '@stores/expenseStore';
import { useIncomeStore } from '@stores/incomeStore';
import { useVehicleStore } from '@stores/vehicleStore';

type Unsubscribe = () => void;

let listeners: Unsubscribe[] = [];

export function startRealtimeSync(vehicleId?: number): void {
  stopRealtimeSync(); // önce eskiyi temizle

  listeners = [
    listenCollection('vehicles', async (rows) => {
      try {
        await upsertRows(vehicles, rows);
        await useVehicleStore.getState().fetchVehicles();
      } catch (e) {
        console.warn('Realtime sync hatası (vehicles):', e);
      }
    }),
    listenCollection('trips', async (rows) => {
      try {
        await upsertRows(trips, rows);
        await useTripStore.getState().fetchTrips(vehicleId);
      } catch (e) {
        console.warn('Realtime sync hatası (trips):', e);
      }
    }),
    listenCollection('fuel_entries', async (rows) => {
      try {
        await upsertRows(fuelEntries, rows);
        await useFuelStore.getState().fetchFuelEntries(vehicleId);
      } catch (e) {
        console.warn('Realtime sync hatası (fuel_entries):', e);
      }
    }),
    listenCollection('expenses', async (rows) => {
      try {
        await upsertRows(expenses, rows);
        await useExpenseStore.getState().fetchExpenses(vehicleId);
      } catch (e) {
        console.warn('Realtime sync hatası (expenses):', e);
      }
    }),
    listenCollection('income_entries', async (rows) => {
      try {
        await upsertRows(incomeEntries, rows);
        await useIncomeStore.getState().fetchEntries(vehicleId);
      } catch (e) {
        console.warn('Realtime sync hatası (income_entries):', e);
      }
    }),
  ];
}

export function stopRealtimeSync(): void {
  listeners.forEach((unsub) => unsub());
  listeners = [];
}
