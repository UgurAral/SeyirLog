/**
 * sync.ts — Lokal SQLite ↔ Firestore senkronizasyon
 *
 * Strateji:
 *  - Yazma: SQLite'a anında yaz, arka planda Firestore'a gönder
 *  - Giriş: Firestore'dan çek, lokal SQLite'ı güncelle
 *  - Çevrimdışı: Firestore SDK kendi kuyruğunu yönetir
 */

import type { AnySQLiteTable } from 'drizzle-orm/sqlite-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ── Firestore satırlarını yerel SQLite'a yaz (insert ya da güncelle) ─────────
// SQLite her zaman tek gerçek kaynak: uzaktan gelen veri önce buraya işlenir,
// ekran state'i sonra buradan (fetchX) yenilenir.
export async function upsertRows(table: AnySQLiteTable, rows: any[]): Promise<void> {
  for (const row of rows) {
    const { _syncedAt, ...data } = row;
    await localDb
      .insert(table)
      .values(data)
      .onConflictDoUpdate({ target: (table as any).id, set: data });
  }
}

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
  for (const { name, table } of COLLECTIONS) {
    const rows = await fsPullAll(name);
    if (rows.length > 0) {
      await upsertRows(table, rows);
    }
  }
  // Store'ları güncel yerel veriyle yenile
  await useVehicleStore.getState().fetchVehicles();
  await useTripStore.getState().fetchTrips();
  await useFuelStore.getState().fetchFuelEntries();
  await useExpenseStore.getState().fetchExpenses();
  await useIncomeStore.getState().fetchEntries();
}

// ── Yerel veriyi tamamen sil (hesap değişiminde önceki kullanıcının verisi
// yeni hesaba karışmasın diye) ────────────────────────────────────────────────
const LOCAL_DATA_UID_KEY = '@seyirlog_local_data_uid';

export async function clearAllLocalData(): Promise<void> {
  await localDb.delete(incomeEntries);
  await localDb.delete(expenses);
  await localDb.delete(fuelEntries);
  await localDb.delete(trips);
  await localDb.delete(vehicles);
}

// ── Giriş sonrası tam sync ───────────────────────────────────────────────────
// Lokal SQLite, o an cihazda giriş yapılmış tek bir kullanıcıya ait kabul
// edilir. Farklı bir hesapla giriş yapıldığında (uid değiştiğinde), önceki
// kullanıcının kalıntı verisini yeni hesaba karıştırmamak / yanlışlıkla
// onun Firestore'una push etmemek için önce lokal veriyi tamamen temizleyip
// sıfırdan çekiyoruz — aynı hesaba tekrar giriş yapılıyorsa normal push+pull.
export async function onLoginSync(uid: string): Promise<void> {
  try {
    const storedUid = await AsyncStorage.getItem(LOCAL_DATA_UID_KEY);
    if (storedUid !== uid) {
      await clearAllLocalData();
      await AsyncStorage.setItem(LOCAL_DATA_UID_KEY, uid);
    } else {
      await pushAllToCloud();
    }
    await pullFromCloud();
  } catch (e) {
    console.warn('Sync hatası:', e);
  }
}
