/**
 * sync.ts — Lokal SQLite ↔ Firestore senkronizasyon
 *
 * Strateji:
 *  - Yazma: SQLite'a anında yaz, arka planda Firestore'a gönder
 *  - Giriş: Firestore'dan çek, lokal SQLite'ı güncelle
 *  - Çevrimdışı: Firestore SDK kendi kuyruğunu yönetir
 */

import { db as localDb } from '@db/index';
import {
  vehicles, trips, fuelEntries, expenses, incomeEntries,
} from '@db/schema';
import { pushLocalToFirestore, fsPullAll } from '@services/firestore';
import { useTripStore } from '@stores/tripStore';
import { useFuelStore } from '@stores/fuelStore';
import { useExpenseStore } from '@stores/expenseStore';
import { useIncomeStore } from '@stores/incomeStore';
import { useVehicleStore } from '@stores/vehicleStore';

const COLLECTIONS = [
  { name: 'vehicles',       table: vehicles       },
  { name: 'trips',          table: trips          },
  { name: 'fuel_entries',   table: fuelEntries    },
  { name: 'expenses',       table: expenses       },
  { name: 'income_entries', table: incomeEntries  },
] as const;

// ── Lokal → Firestore (ilk giriş veya manuel) ────────────────────────────────
export async function pushAllToCloud(): Promise<void> {
  for (const { name, table } of COLLECTIONS) {
    const rows = await localDb.select().from(table);
    if (rows.length > 0) {
      await pushLocalToFirestore(name, rows);
    }
  }
}

// ── Firestore → Lokal (başka cihazdan gelen veriler) ─────────────────────────
export async function pullFromCloud(): Promise<void> {
  // Araçları çek + store'ları yenile
  await useTripStore.getState().fetchTrips();
  await useFuelStore.getState().fetchFuelEntries();
  await useExpenseStore.getState().fetchExpenses();
  await useIncomeStore.getState().fetchEntries();
  await useVehicleStore.getState().fetchVehicles();
}

// ── Giriş sonrası tam sync ───────────────────────────────────────────────────
export async function onLoginSync(): Promise<void> {
  try {
    // 1. Lokal veri varsa cloud'a yükle
    await pushAllToCloud();
    // 2. Cloud'dan en güncel veriyi çek
    await pullFromCloud();
  } catch (e) {
    console.warn('Sync hatası:', e);
  }
}
