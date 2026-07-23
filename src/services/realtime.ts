/**
 * realtime.ts — Firestore gerçek zamanlı dinleyiciler
 * Aynı hesapla 2. cihazda değişiklik olunca store'lar anında güncellenir.
 */

import { listenCollection } from '@services/firestore';
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
    listenCollection('vehicles', (rows) => {
      useTripStore.setState({}); // trigger re-render
      useVehicleStore.setState({ vehicles: rows });
    }),
    listenCollection('trips', (rows) => {
      const filtered = vehicleId
        ? rows.filter((r) => r.vehicleId === vehicleId)
        : rows;
      useTripStore.setState({ trips: filtered });
    }),
    listenCollection('fuel_entries', (rows) => {
      const filtered = vehicleId
        ? rows.filter((r) => r.vehicleId === vehicleId)
        : rows;
      useFuelStore.setState({ fuelEntries: filtered });
    }),
    listenCollection('expenses', (rows) => {
      const filtered = vehicleId
        ? rows.filter((r) => r.vehicleId === vehicleId)
        : rows;
      useExpenseStore.setState({ expenses: filtered });
    }),
    listenCollection('income_entries', (rows) => {
      const filtered = vehicleId
        ? rows.filter((r) => r.vehicleId === vehicleId)
        : rows;
      useIncomeStore.setState({ entries: rows });
    }),
  ];
}

export function stopRealtimeSync(): void {
  listeners.forEach((unsub) => unsub());
  listeners = [];
}
