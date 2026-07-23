/**
 * backup.ts — SeyirLog veri yedekleme & geri yükleme
 *
 * Yedek formatı:
 * {
 *   version: 1,
 *   exportedAt: <unix timestamp>,
 *   appVersion: "1.1.0",
 *   data: { vehicles, trips, fuelEntries, expenses, incomeEntries }
 * }
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@db/index';
import {
  vehicles,
  trips,
  fuelEntries,
  expenses,
  incomeEntries,
} from '@db/schema';

const BACKUP_VERSION = 1;
const APP_VERSION = '1.1.0';

export interface BackupData {
  version: number;
  exportedAt: number;
  appVersion: string;
  data: {
    vehicles: unknown[];
    trips: unknown[];
    fuelEntries: unknown[];
    expenses: unknown[];
    incomeEntries: unknown[];
  };
}

export interface RestoreResult {
  success: boolean;
  message: string;
  counts?: {
    vehicles: number;
    trips: number;
    fuelEntries: number;
    expenses: number;
    incomeEntries: number;
  };
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<{ success: boolean; message: string }> {
  try {
    const [vehicleRows, tripRows, fuelRows, expenseRows, incomeRows] = await Promise.all([
      db.select().from(vehicles),
      db.select().from(trips),
      db.select().from(fuelEntries),
      db.select().from(expenses),
      db.select().from(incomeEntries),
    ]);

    const backup: BackupData = {
      version: BACKUP_VERSION,
      exportedAt: Math.floor(Date.now() / 1000),
      appVersion: APP_VERSION,
      data: {
        vehicles: vehicleRows,
        trips: tripRows,
        fuelEntries: fuelRows,
        expenses: expenseRows,
        incomeEntries: incomeRows,
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `SeyirLog_yedek_${date}.json`;

    // Yeni expo-file-system v19 API
    const file = new File(Paths.cache, fileName);
    await file.write(json);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, message: 'Paylaşım bu cihazda desteklenmiyor.' };
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'SeyirLog Yedeği',
      UTI: 'public.json',
    });

    return { success: true, message: 'Yedek başarıyla oluşturuldu.' };
  } catch (err) {
    return { success: false, message: `Yedekleme hatası: ${String(err)}` };
  }
}

// ── IMPORT ────────────────────────────────────────────────────────────────────

export async function importBackup(): Promise<RestoreResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, message: 'Dosya seçimi iptal edildi.' };
    }

    const uri = result.assets[0].uri;
    const file = new File(uri);
    const content = await file.text();

    let backup: BackupData;
    try {
      backup = JSON.parse(content);
    } catch {
      return { success: false, message: 'Geçersiz dosya formatı.' };
    }

    if (!backup.version || !backup.data) {
      return { success: false, message: 'Bu dosya SeyirLog yedeği değil.' };
    }
    if (backup.version !== BACKUP_VERSION) {
      return {
        success: false,
        message: `Uyumsuz yedek versiyonu (v${backup.version}).`,
      };
    }

    const d = backup.data;

    // Mevcut verileri sil
    await db.delete(incomeEntries);
    await db.delete(expenses);
    await db.delete(fuelEntries);
    await db.delete(trips);
    await db.delete(vehicles);

    const counts = { vehicles: 0, trips: 0, fuelEntries: 0, expenses: 0, incomeEntries: 0 };

    if (d.vehicles?.length) {
      await db.insert(vehicles).values(d.vehicles as never[]);
      counts.vehicles = d.vehicles.length;
    }
    if (d.trips?.length) {
      await db.insert(trips).values(d.trips as never[]);
      counts.trips = d.trips.length;
    }
    if (d.fuelEntries?.length) {
      await db.insert(fuelEntries).values(d.fuelEntries as never[]);
      counts.fuelEntries = d.fuelEntries.length;
    }
    if (d.expenses?.length) {
      await db.insert(expenses).values(d.expenses as never[]);
      counts.expenses = d.expenses.length;
    }
    if (d.incomeEntries?.length) {
      await db.insert(incomeEntries).values(d.incomeEntries as never[]);
      counts.incomeEntries = d.incomeEntries.length;
    }

    return { success: true, message: 'Veriler başarıyla geri yüklendi.', counts };
  } catch (err) {
    return { success: false, message: `Geri yükleme hatası: ${String(err)}` };
  }
}
